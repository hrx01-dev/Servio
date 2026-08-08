import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import crypto from "crypto";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 };
const RATE_LIMIT_COLLECTION = "razorpayRateLimit";

function isValidEmail(raw: string): boolean {
  const v = raw.trim();
  return v.length >= 5 && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function initAdmin(): boolean {
  if (getApps().length) return true;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
    } else {
      if (process.env.NODE_ENV !== "production" && !process.env.GOOGLE_APPLICATION_CREDENTIALS) return false;
      initializeApp({ projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID });
    }
    return true;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return false;
  }
}

function callerIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : (forwarded ?? "");
  return raw.split(",")[0].trim() || "unknown";
}

async function checkRateLimit(ip: string, secret: string, now: number) {
  const db = getFirestore();
  const key = crypto.createHmac("sha256", secret).update(ip).digest("hex");
  const ref = db.collection(RATE_LIMIT_COLLECTION).doc(key);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const stored = snap.exists ? snap.get("timestamps") : undefined;
    const history: number[] = Array.isArray(stored)
      ? (stored as unknown[]).filter((t): t is number => typeof t === "number")
      : [];
    const recent = history.filter((t) => t > now - RATE_LIMIT.windowMs && t <= now);
    if (recent.length >= RATE_LIMIT.maxRequests) {
      const oldest = Math.min(...recent);
      return { allowed: false, retryAfterMs: oldest + RATE_LIMIT.windowMs - now };
    }
    tx.set(ref, { timestamps: [...recent, now], updatedAt: FieldValue.serverTimestamp() });
    return { allowed: true, retryAfterMs: 0 };
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const defaultAllowedOrigin = process.env.ALLOWED_ORIGIN || "https://servio-0.web.app";
  const configuredOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
  const allowedOrigins = new Set([defaultAllowedOrigin, ...configuredOrigins]);
  const safeOrigin = typeof origin === "string" && origin !== "null" && allowedOrigins.has(origin) ? origin : defaultAllowedOrigin;
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", safeOrigin);
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const action = req.query.action as string;
  if (!action) return res.status(400).json({ error: "Action is required" });
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!razorpayKeyId || !razorpayKeySecret) return res.status(500).json({ error: "Razorpay credentials are not configured on the server." });
  const razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });

  try {
    if (typeof req.body !== "object" || req.body === null) return res.status(400).json({ error: "Invalid request body" });

    if (action === "createOrder") {
      // Rate limiting must not make the payment endpoint unavailable when the
      // optional hashing secret has not yet been configured. The billing lookup
      // below still requires Firebase Admin, while the limiter is applied whenever
      // RATE_LIMIT_HASH_SECRET is present.
      const hashSecret = process.env.RATE_LIMIT_HASH_SECRET;
      if (hashSecret) {
        if (!initAdmin()) return res.status(500).json({ error: "Server is not configured correctly. Please try again later." });
        try {
          const verdict = await checkRateLimit(callerIp(req), hashSecret, Date.now());
          if (!verdict.allowed) {
            res.setHeader("Retry-After", String(Math.ceil(verdict.retryAfterMs / 1000)));
            return res.status(429).json({ error: "Too many order requests. Please try again later.", retryAfterMs: verdict.retryAfterMs });
          }
        } catch (error) {
          console.error("Razorpay rate-limit check failed:", error);
          // Do not block legitimate payment attempts because the auxiliary
          // rate-limit store is temporarily unavailable.
        }
      }

      const { amount, clientEmail } = req.body;
      if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
      if (typeof clientEmail !== "string" || !isValidEmail(clientEmail)) return res.status(400).json({ error: "Invalid clientEmail" });
      const amountInPaisa = Math.round(amount * 100);
      if (!Number.isSafeInteger(amountInPaisa)) return res.status(400).json({ error: "Amount is out of range" });

      if (!initAdmin()) return res.status(500).json({ error: "Server is not configured correctly. Please try again later." });
      const db = getFirestore();
      const normalizedEmail = clientEmail.trim().toLowerCase();
      const billingDoc = await db.collection("projectBilling").doc(normalizedEmail).get();
      if (!billingDoc.exists) return res.status(404).json({ error: "Billing record not found for this client" });
      const billingData = billingDoc.data();
      const totalCost = Number(billingData?.totalCost) || 0;
      const payments: Array<Record<string, unknown>> = billingData?.payments || [];
      const paidSoFar = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      if (amount > totalCost - paidSoFar + 0.01) return res.status(400).json({ error: "Amount exceeds outstanding balance" });

      const order = await razorpay.orders.create({ amount: amountInPaisa, currency: "INR", receipt: `receipt_${Date.now()}` });
      return res.status(200).json({ id: order.id, amount: order.amount, currency: order.currency });
    }

    if (action === "verifyPayment") {
      if (!initAdmin()) return res.status(500).json({ error: "Server is not configured correctly. Please try again later." });
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clientEmail, amount, pendingPaymentId } = req.body;
      if (typeof razorpay_order_id !== "string" || !razorpay_order_id || typeof razorpay_payment_id !== "string" || !razorpay_payment_id || typeof razorpay_signature !== "string" || !razorpay_signature || typeof clientEmail !== "string" || typeof amount !== "number") return res.status(400).json({ error: "Missing or malformed required fields" });
      if (!isValidEmail(clientEmail)) return res.status(400).json({ error: "Invalid clientEmail" });
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
      if (pendingPaymentId !== undefined && typeof pendingPaymentId !== "string") return res.status(400).json({ error: "Invalid pendingPaymentId" });
      const shasum = crypto.createHmac("sha256", razorpayKeySecret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      if (shasum.digest("hex") !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });

      let authenticatedAmount: number;
      try {
        const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
        if (rzpPayment.order_id !== razorpay_order_id) return res.status(400).json({ error: "Payment does not match order" });
        if (rzpPayment.status !== "captured") return res.status(400).json({ error: "Payment has not been captured" });
        const paidPaisa = Number(rzpPayment.amount);
        if (!Number.isFinite(paidPaisa) || paidPaisa <= 0) return res.status(502).json({ error: "Could not verify the payment amount with Razorpay" });
        if (Math.round(amount * 100) !== Math.round(paidPaisa)) return res.status(400).json({ error: "Amount does not match the captured payment" });
        authenticatedAmount = paidPaisa / 100;
      } catch (error) {
        console.error("Failed to fetch Razorpay payment:", error);
        return res.status(502).json({ error: "Could not verify the payment with Razorpay" });
      }

      const db = getFirestore();
      const billingRef = db.collection("projectBilling").doc(clientEmail.trim().toLowerCase());
      const billingDoc = await billingRef.get();
      if (!billingDoc.exists) return res.status(404).json({ error: "Billing record not found for this client" });
      const data = billingDoc.data();
      let payments: Record<string, unknown>[] = data?.payments || [];
      if (payments.some((p) => p.reference === razorpay_payment_id || p.id === razorpay_payment_id)) return res.status(409).json({ error: "This payment has already been recorded" });

      if (pendingPaymentId) {
        let matched = false;
        payments = payments.map((p) => {
          if (p.id === pendingPaymentId) {
            matched = true;
            return { ...p, amount: authenticatedAmount, status: "completed", method: "Razorpay", reference: razorpay_payment_id, date: new Date().toISOString() };
          }
          return p;
        });
        if (!matched) return res.status(404).json({ error: "Pending payment not found" });
      } else {
        payments.push({ id: razorpay_payment_id, amount: authenticatedAmount, method: "Razorpay", reference: razorpay_payment_id, status: "completed", date: new Date().toISOString() });
      }
      await billingRef.update({ payments, updatedAt: FieldValue.serverTimestamp() });
      return res.status(200).json({ success: true });
    }
    return res.status(400).json({ error: "Unknown action" });
  } catch (error: unknown) {
    console.error("Razorpay Error:", error);
    return res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process request" });
  }
}
