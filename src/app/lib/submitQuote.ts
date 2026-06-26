// Persists a quote/proposal request and queues an email notification.
//
// Two writes happen on a successful submission:
//   1. `messages` — the durable lead record the business reads in the admin
//      inbox (src/admin/pages/Messages.tsx). Its shape is dictated by the
//      public-create rule in firestore.rules (`messages` match block): exactly
//      { name, email, subject?, body, status:'new', createdAt:serverTimestamp }.
//   2. `mail` — consumed by the Firebase "Trigger Email" extension, which sends
//      it as an email. The recipient is pinned to QUOTE_NOTIFY_EMAIL (kept in
//      sync with the `to ==` check in the firestore.rules `mail` block) so the
//      collection can never be used as an open relay; `replyTo` is the prospect
//      so the owner can reply straight to them.
//
// The email write is best-effort: the lead is already saved by step 1, so a
// missing extension or an undeployed `mail` rule must never fail the user's
// submission (losing leads is the bug we are fixing — see issue #9).

import { addDoc, collection, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "@/Firebase/firebase";
import type { QuoteFormData } from "./quoteValidation";

/**
 * Where new-lead notifications are emailed. MUST match the `to ==` recipient in
 * the firestore.rules `mail` block — the rule pins it server-side, so changing
 * it requires editing both places (and is documented in docs/QUOTE_FORM.md).
 */
export const QUOTE_NOTIFY_EMAIL = "hello@servio.dev";

const MESSAGES_COLLECTION = "messages";
const MAIL_COLLECTION = "mail";

export type QuoteSummary = {
  name: string;
  email: string;
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pure: turn the raw form into the trimmed, presentation-ready pieces shared by
 * both writes. No Firebase, no DOM — safe to unit test and to reuse server-side.
 */
export function buildQuoteSummary(form: QuoteFormData): QuoteSummary {
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();
  const business = form.business.trim();
  const budget = form.budget.trim();
  const type = form.type.trim();
  const description = form.description.trim();

  const subject = `New quote request: ${type} — ${business}`;

  const text = [
    `New proposal request from ${name} (${business}).`,
    ``,
    `Email: ${email}`,
    `Phone: ${phone || "—"}`,
    `Budget: ${budget}`,
    `Website type: ${type}`,
    ``,
    `Project description:`,
    description || "(none provided)",
  ].join("\n");

  const html = [
    `<h2>New quote request</h2>`,
    `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(business)})</p>`,
    `<ul>`,
    `<li>Email: ${escapeHtml(email)}</li>`,
    `<li>Phone: ${escapeHtml(phone || "—")}</li>`,
    `<li>Budget: ${escapeHtml(budget)}</li>`,
    `<li>Website type: ${escapeHtml(type)}</li>`,
    `</ul>`,
    `<p><strong>Project description</strong></p>`,
    `<p>${escapeHtml(description || "(none provided)").replace(/\n/g, "<br>")}</p>`,
  ].join("");

  return { name, email, subject, text, html };
}

/** Pure: the `messages` document body (createdAt is attached at write time). */
export function buildMessageData(summary: QuoteSummary) {
  return {
    name: summary.name,
    email: summary.email,
    subject: summary.subject,
    body: summary.text,
    status: "new" as const,
  };
}

/** Pure: the `mail` document for the Trigger Email extension. */
export function buildMailData(summary: QuoteSummary) {
  return {
    to: [QUOTE_NOTIFY_EMAIL],
    replyTo: summary.email,
    message: {
      subject: summary.subject,
      text: summary.text,
      html: summary.html,
    },
  };
}

// Retrieve or generate a persistent session ID for rate limiting
function getSessionId(): string {
  let sessionId = localStorage.getItem("servio:quote:session");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("servio:quote:session", sessionId);
  }
  return sessionId;
}

/**
 * Persist the lead, then queue the notification email, using a Firestore batch
 * to also update the rate_limits document. Rejects only if the lead itself could
 * not be saved; a failed email queue write is logged and swallowed.
 */
export async function submitQuote(form: QuoteFormData, honeypot: string = ""): Promise<void> {
  // Honeypot triggered — log to spam_logs (append-only, no read rule for clients)
  // then return a simulated success so the bot gets no signal.
  if (honeypot.trim().length > 0) {
    const sessionId = getSessionId();
    console.warn("[quote] Honeypot triggered. Logging to spam_logs.");
    try {
      await addDoc(collection(db, "spam_logs"), {
        honeypot: honeypot.trim().slice(0, 500),
        sessionId,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Best-effort — never block the simulated-success path
    }
    return;
  }

  const summary = buildQuoteSummary(form);
  const messageData = buildMessageData(summary);
  const mailData = buildMailData(summary);
  const sessionId = getSessionId();

  try {
    // We do a small pre-check of the rate limit to provide a friendly error message,
    // although the authoritative enforcement happens in Firestore Rules during the batch commit.
    const rateLimitRef = doc(db, "rate_limits", sessionId);
    const rateLimitSnap = await getDoc(rateLimitRef);

    let nextCount = 1;
    let windowStart = serverTimestamp();

    if (rateLimitSnap.exists()) {
      const data = rateLimitSnap.data();
      const now = Date.now();
      const windowStartMs = data.windowStart?.toMillis?.() ?? now;

      if (now - windowStartMs <= 60000) {
        if (data.count >= 5) {
          throw new Error("Too many submissions. Please wait a minute before trying again.");
        }
        nextCount = data.count + 1;
        // Keep existing window start if not resetting
        windowStart = data.windowStart;
      }
    }

    const batch = writeBatch(db);

    // 1. Write the message
    const messageRef = doc(collection(db, MESSAGES_COLLECTION));
    batch.set(messageRef, {
      ...messageData,
      sessionId,
      honeypot: "",
      createdAt: serverTimestamp(),
    });

    // 2. Queue the email notification — best-effort; never block lead capture on it.
    const mailRef = doc(collection(db, MAIL_COLLECTION));
    batch.set(mailRef, {
      ...mailData,
      sessionId,
      createdAt: serverTimestamp(),
    });

    // 3. Update the rate limits
    batch.set(rateLimitRef, {
      count: nextCount,
      windowStart: windowStart,
      lastWrite: serverTimestamp(),
    });

    await batch.commit();
  } catch (err: unknown) {
    console.error("[quote] error submitting quote to Firestore:", err);
    if (err instanceof Error && err.message.includes("Too many submissions")) {
      throw err;
    }

    // Narrowing for Firestore-specific error codes
    if (typeof err === "object" && err !== null && "code" in err) {
      if ((err as { code: string }).code === "permission-denied") {
        throw new Error("Too many submissions. Please wait a minute before trying again.");
      }
    }
    throw err;
  }
}
