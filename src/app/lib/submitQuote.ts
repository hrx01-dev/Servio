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

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

/**
 * Persist the lead, then queue the notification email. Rejects only if the lead
 * itself could not be saved; a failed email queue write is logged and swallowed.
 */
export async function submitQuote(form: QuoteFormData): Promise<void> {
  const summary = buildQuoteSummary(form);

  // 1. Durable lead record — must succeed; a failure propagates to the caller.
  await addDoc(collection(db, MESSAGES_COLLECTION), {
    ...buildMessageData(summary),
    createdAt: serverTimestamp(),
  });

  // 2. Email notification — best-effort; never block lead capture on it.
  try {
    await addDoc(collection(db, MAIL_COLLECTION), {
      ...buildMailData(summary),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn(
      "[quote] lead saved, but the email notification could not be queued:",
      err,
    );
  }
}
