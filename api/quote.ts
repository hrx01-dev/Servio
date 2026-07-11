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

// Returns true only when the Admin SDK is ready. A bad FIREBASE_SERVICE_ACCOUNT
// must NOT let the handler fall through to getFirestore() and crash mid-request
// with an unhandled error — the caller turns a false into a controlled 500.
function initAdmin(): boolean {
  if (getApps().length) return true;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
      });
    } else {
      initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
      });
    }
    return true;
  } catch (err) {
    console.error("[quote] Firebase Admin init error:", err);
    return false;
  }
}

// ── IP helpers ────────────────────────────────────────────────────────────────

function callerIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : (forwarded ?? "");
  return raw.split(",")[0].trim() || "unknown";
}

// Keyed HMAC (not a bare SHA-256) so a stored identifier can't be reversed with
// a small IP dictionary — an unsalted hash of an IPv4 address is trivially
// brute-forced. The pepper lives only in server env and is never stored.
function hashIp(ip: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

// ── Rate limit config ─────────────────────────────────────────────────────────

// 3 submissions per IP per 10 minutes — matches the client-side advisory limit.
const SERVER_RATE_LIMIT = { maxSubmissions: 3, windowMs: 10 * 60 * 1000 };
const RATE_LIMIT_COLLECTION = "quoteRateLimit";

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Fail closed on any missing server configuration — never fall through to a
  // half-initialised state that crashes or silently disables enforcement.
  if (!initAdmin()) {
    return res
      .status(500)
      .json({ error: "Server is not configured correctly. Please try again later." });
  }

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (!allowedOrigin) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: ALLOWED_ORIGIN is not set." });
  }

  const hashSecret = process.env.RATE_LIMIT_HASH_SECRET;
  if (!hashSecret) {
    return res
      .status(500)
      .json({ error: "Server misconfiguration: RATE_LIMIT_HASH_SECRET is not set." });
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

  // 3. Atomic rate limit — read → check → update inside ONE Firestore
  //    transaction so concurrent requests can't each read the same window and
  //    slip past the cap. Any transaction failure FAILS CLOSED (500) rather than
  //    letting the write proceed with enforcement silently disabled.
  const db = getFirestore();
  const ipKey = hashIp(callerIp(req), hashSecret);
  const rateLimitRef = db.collection(RATE_LIMIT_COLLECTION).doc(ipKey);
  const now = Date.now();

  let rateVerdict: { allowed: boolean; retryAfterMs: number };
  try {
    rateVerdict = await db.runTransaction(async (tx) => {
      const snap = await tx.get(rateLimitRef);
      const stored = snap.exists ? snap.get("timestamps") : undefined;
      const history = Array.isArray(stored)
        ? (stored as unknown[]).filter((t): t is number => typeof t === "number")
        : [];
      const result = evaluateRateLimit(history, now, SERVER_RATE_LIMIT);
      // Consume the slot inside the transaction so it's atomic with the read.
      if (result.allowed) {
        tx.set(rateLimitRef, {
          timestamps: result.nextHistory,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
      return { allowed: result.allowed, retryAfterMs: result.retryAfterMs };
    });
  } catch (err) {
    console.error("[quote] rate-limit transaction failed:", err);
    return res
      .status(500)
      .json({ error: "Could not process your request right now. Please try again." });
  }

  if (!rateVerdict.allowed) {
    res.setHeader("Retry-After", String(Math.ceil(rateVerdict.retryAfterMs / 1000)));
    return res.status(429).json({
      error: "Too many submissions. Please try again later.",
      retryAfterMs: rateVerdict.retryAfterMs,
    });
  }

  // 4. Write the lead (bypasses security rules — input is validated above).
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

  // 5. Email notification — best-effort; the lead is already saved.
  try {
    await db.collection("mail").add({
      ...buildMailData(summary),
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.warn("[quote] lead saved but email notification failed:", err);
  }

  return res.status(200).json({ success: true });
}
