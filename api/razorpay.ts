import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import crypto from "crypto";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
// Reuse the client's email rule verbatim so the server rejects exactly what the
// browser would (see the module's own note on being the single source of truth).
import { isValidEmail } from "../src/app/lib/quoteValidation";

// Firebase initialization moved inside handler to prevent top-level crashes

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Initialize Firebase Admin if not already initialized
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(serviceAccount) });
      } else {
        initializeApp();
      }
    } catch (error) {
      console.error("Firebase admin initialization error:", error);
    }
  }
  const db = getFirestore();
  
  // CORS configuration
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "https://servio-0.web.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const action = req.query.action as string;

  if (!action) {
    return res.status(400).json({ error: "Action is required" });
  }

  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    return res
      .status(500)
      .json({ error: "Razorpay credentials are not configured on the server." });
  }

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  try {
    // A POST with no body or a non-JSON Content-Type leaves req.body undefined;
    // reject it as a malformed request (400) rather than letting the destructure
    // throw into the catch and surface as a 500.
    if (typeof req.body !== "object" || req.body === null) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    if (action === "createOrder") {
      const { amount, clientEmail } = req.body;

      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (typeof clientEmail !== "string" || !isValidEmail(clientEmail)) {
        return res.status(400).json({ error: "Invalid clientEmail" });
      }

      // Razorpay expects amount in paisa (smallest unit)
      const amountInPaisa = Math.round(amount * 100);

      // Guard against overflow: a huge but "finite" amount would round past the
      // safe-integer range and be silently corrupted before reaching Razorpay.
      if (!Number.isSafeInteger(amountInPaisa)) {
        return res.status(400).json({ error: "Amount is out of range" });
      }

      const orderOptions = {
        amount: amountInPaisa,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(orderOptions);

      return res.status(200).json({
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    }

    if (action === "verifyPayment") {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        clientEmail,
        amount,
        pendingPaymentId,
      } = req.body;

      if (
        typeof razorpay_order_id !== "string" || !razorpay_order_id ||
        typeof razorpay_payment_id !== "string" || !razorpay_payment_id ||
        typeof razorpay_signature !== "string" || !razorpay_signature ||
        typeof clientEmail !== "string" ||
        typeof amount !== "number"
      ) {
        return res.status(400).json({ error: "Missing or malformed required fields" });
      }

      if (!isValidEmail(clientEmail)) {
        return res.status(400).json({ error: "Invalid clientEmail" });
      }

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (pendingPaymentId !== undefined && typeof pendingPaymentId !== "string") {
        return res.status(400).json({ error: "Invalid pendingPaymentId" });
      }

      // Verify signature
      const shasum = crypto.createHmac("sha256", razorpayKeySecret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest("hex");

      if (digest !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      // Record successful payment in Firestore
      const normalizedEmail = clientEmail.trim().toLowerCase();
      const billingRef = db.collection("projectBilling").doc(normalizedEmail);

      const billingDoc = await billingRef.get();
      if (!billingDoc.exists) {
        return res
          .status(404)
          .json({ error: "Billing record not found for this client" });
      }

      const data = billingDoc.data();
      let payments: Record<string, unknown>[] = data?.payments || [];

      if (pendingPaymentId) {
        // Update the existing pending payment
        payments = payments.map((p) => {
          if (p.id === pendingPaymentId) {
            return {
              ...p,
              status: "completed",
              method: "Razorpay",
              reference: razorpay_payment_id,
              date: new Date().toISOString(), // Optional: update date to completion date
            };
          }
          return p;
        });
      } else {
        // Append a new payment
        const newPayment = {
          id: razorpay_payment_id, // Use razorpay payment id for new ad-hoc payments
          amount: Number(amount),
          method: "Razorpay",
          reference: razorpay_payment_id,
          status: "completed",
          date: new Date().toISOString(),
        };
        payments.push(newPayment);
      }

      // Update the document with the modified array
      await billingRef.update({
        payments: payments,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (error: unknown) {
    console.error("Razorpay Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process request";
    return res.status(500).json({ error: errorMessage });
  }
}
