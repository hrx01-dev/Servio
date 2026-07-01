import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";
import {
  evaluateRateLimit,
  validateFields,
  hasErrors,
  type QuoteFormData,
} from "../src/app/lib/quoteValidation";
import {
  buildQuoteSummary,
  buildMessageData,
  buildMailData,
} from "../src/app/lib/submitQuote";

// ── Firebase Admin ────────────────────────────────────────────────────────────

function initAdmin() {
  if (getApps().length) return;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      });
    } else {
      initializeApp();
    }
  } catch (err) {
    console.error("[quote] Firebase Admin init error:", err);
  }
}

// ── IP helpers ────────────────────────────────────────────────────────────────

function callerIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : (forwarded ?? "");
  return raw.split(",")[0].trim() || "unknown";
}

// Hash the IP so raw addresses are never stored in Firestore.
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

// ── Rate limit config ─────────────────────────────────────────────────────────

// 3 submissions per IP per 10 minutes — matches the client-side advisory limit.
const SERVER_RATE_LIMIT = { maxSubmissions: 3, windowMs: 10 * 60 * 1000 };
const RATE_LIMIT_COLLECTION = "quoteRateLimit";

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  initAdmin();

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowedOrigin) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: ALLOWED_ORIGIN is not set." });
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Parse body — coerce every field to string so validateFields sees clean input.
  const body = req.body ?? {};
  const form: QuoteFormData = {
    name:        typeof body.name        === "string" ? body.name        : "",
    email:       typeof body.email       === "string" ? body.email       : "",
    phone:       typeof body.phone       === "string" ? body.phone       : "",
    business:    typeof body.business    === "string" ? body.business    : "",
    budget:      typeof body.budget      === "string" ? body.budget      : "",
    type:        typeof body.type        === "string" ? body.type        : "",
    description: typeof body.description === "string" ? body.description : "",
  };

  // 2. Field validation (same rules as the client, authoritative here).
  const fieldErrors = validateFields(form);
  if (hasErrors(fieldErrors)) {
    return res.status(400).json({ error: "Invalid submission", fieldErrors });
  }

  // 3. Server-side rate limit keyed by hashed caller IP.
  const db = getFirestore();
  const ipKey = hashIp(callerIp(req));
  const rateLimitRef = db.collection(RATE_LIMIT_COLLECTION).doc(ipKey);

  let history: number[] = [];
  try {
    const snap = await rateLimitRef.get();
    if (snap.exists) {
      const data = snap.data();
      history = Array.isArray(data?.timestamps)
        ? (data.timestamps as unknown[]).filter((t): t is number => typeof t === "number")
        : [];
    }
  } catch (err) {
    // If the rate-limit doc can't be read, fail open rather than blocking a
    // legitimate user over an infrastructure hiccup. Log so we can investigate.
    console.warn("[quote] rate-limit read failed, proceeding:", err);
  }

  const now = Date.now();
  const rateResult = evaluateRateLimit(history, now, SERVER_RATE_LIMIT);
  if (!rateResult.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rateResult.retryAfterMs / 1000)));
    return res.status(429).json({
      error: "Too many submissions. Please try again later.",
      retryAfterMs: rateResult.retryAfterMs,
    });
  }

  // 4. Write the lead to Firestore (bypasses security rules — input is validated above).
  const summary = buildQuoteSummary(form);

  try {
    await db.collection("messages").add({
      ...buildMessageData(summary),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error("[quote] failed to save lead:", err);
    return res.status(500).json({
      error: "Failed to save your request. Please try again.",
    });
  }

  // Email notification — best-effort; the lead is already saved.
  try {
    await db.collection("mail").add({
      ...buildMailData(summary),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("[quote] lead saved but email notification failed:", err);
  }

  // 5. Persist the updated rate-limit window — best-effort.
  try {
    await rateLimitRef.set({
      timestamps: rateResult.nextHistory,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("[quote] rate-limit update failed:", err);
  }

  return res.status(200).json({ success: true });
}
