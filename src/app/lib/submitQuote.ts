// Client-side quote submission.
//
// The actual Firestore writes and rate-limit enforcement happen in api/quote.ts
// (a Vercel serverless function). This module posts the form to that endpoint
// and translates HTTP error codes into typed errors the component can switch on.
//
// The pure helper functions (buildQuoteSummary, buildMessageData, buildMailData)
// are kept here so they can be unit-tested in isolation and imported by the
// server handler to avoid duplication.

import { LIMITS, type QuoteFormData } from "./quoteValidation";

export const QUOTE_NOTIFY_EMAIL = "hello@servio.dev";

// ── Pure helpers (also imported by api/quote.ts) ──────────────────────────────

const CONTROL_CHAR_RE =
  // eslint-disable-next-line no-control-regex
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

function sanitize(value: string, maxChars: number): string {
  return value.replace(CONTROL_CHAR_RE, "").slice(0, maxChars);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type QuoteSummary = {
  name: string;
  email: string;
  subject: string;
  text: string;
  html: string;
};

export function buildQuoteSummary(form: QuoteFormData): QuoteSummary {
  const name        = sanitize(form.name.trim(),        LIMITS.name[1]);
  const email       = sanitize(form.email.trim(),       LIMITS.email[1]);
  const phone       = sanitize(form.phone.trim(),       LIMITS.phone[1]);
  const business    = sanitize(form.business.trim(),    LIMITS.business[1]);
  const budget      = form.budget.trim();
  const type        = form.type.trim();
  const description = sanitize(form.description.trim(), LIMITS.description[1]);

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

export function buildMessageData(summary: QuoteSummary) {
  return {
    name:    summary.name,
    email:   summary.email,
    subject: summary.subject,
    body:    summary.text,
    status:  "new" as const,
  };
}

export function buildMailData(summary: QuoteSummary) {
  return {
    to:      [QUOTE_NOTIFY_EMAIL],
    replyTo: summary.email,
    message: {
      subject: summary.subject,
      text:    summary.text,
      html:    summary.html,
    },
  };
}

// ── Error types ───────────────────────────────────────────────────────────────

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly retryAfterMs: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

// ── submitQuote ───────────────────────────────────────────────────────────────

export async function submitQuote(form: QuoteFormData): Promise<void> {
  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });

  if (res.status === 429) {
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    const retryMs = typeof data.retryAfterMs === "number" ? data.retryAfterMs : 0;
    const minutes = Math.ceil(retryMs / 60_000);
    throw new RateLimitError(
      minutes > 0
        ? `You've sent a few requests already. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`
        : "You've sent a few requests already. Please try again shortly.",
      retryMs,
    );
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to submit your request.",
    );
  }
}
