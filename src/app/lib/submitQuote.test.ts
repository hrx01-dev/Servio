/**
 * submitQuote.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the quote submission helpers.
 *
 * The pure functions (buildQuoteSummary, buildMailData) are tested directly.
 * submitQuote() is tested by mocking fetch — actual Firestore writes happen
 * server-side in api/quote.ts which re-uses the same pure helpers.
 *
 * Run with: npx vitest run src/app/lib/submitQuote.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { QuoteFormData } from "./quoteValidation";
import {
  submitQuote,
  buildQuoteSummary,
  buildMailData,
  QUOTE_NOTIFY_EMAIL,
  RateLimitError,
} from "./submitQuote";

const validForm: QuoteFormData = {
  name: "  Sarah Chen  ",
  email: " sarah@company.com ",
  phone: "+1 555 123 4567",
  business: "TechStart Inc.",
  budget: "₹75,000 – ₹2,00,000",
  type: "Business Website",
  description: "Need a new marketing site.",
};

// ── buildQuoteSummary ─────────────────────────────────────────────────────────

describe("buildQuoteSummary", () => {
  it("trims fields and composes subject + text", () => {
    const s = buildQuoteSummary(validForm);
    expect(s.name).toBe("Sarah Chen");
    expect(s.email).toBe("sarah@company.com");
    expect(s.subject).toBe("New quote request: Business Website — TechStart Inc.");
    expect(s.text).toContain("Email: sarah@company.com");
    expect(s.text).toContain("Phone: +1 555 123 4567");
    expect(s.text).toContain("Budget: ₹75,000 – ₹2,00,000");
    expect(s.text).toContain("Need a new marketing site.");
  });

  it("shows placeholders for omitted optionals", () => {
    const s = buildQuoteSummary({ ...validForm, phone: "", description: "" });
    expect(s.text).toContain("Phone: —");
    expect(s.text).toContain("(none provided)");
  });

  it("escapes HTML so submitted markup can't inject into the email", () => {
    const s = buildQuoteSummary({
      ...validForm,
      description: "<script>alert(1)</script>",
    });
    expect(s.html).not.toContain("<script>");
    expect(s.html).toContain("&lt;script&gt;");
  });
});

// ── buildMailData ─────────────────────────────────────────────────────────────

describe("buildMailData", () => {
  it("pins the recipient and replies to the prospect", () => {
    const mail = buildMailData(buildQuoteSummary(validForm));
    expect(mail.to).toEqual([QUOTE_NOTIFY_EMAIL]);
    expect(mail.replyTo).toBe("sarah@company.com");
    expect(mail.message.subject).toBe(
      "New quote request: Business Website — TechStart Inc.",
    );
  });
});

// ── submitQuote ───────────────────────────────────────────────────────────────

describe("submitQuote", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs to /api/quote and resolves on 200", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await expect(submitQuote(validForm)).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      "/api/quote",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends the form data as JSON in the request body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    await submitQuote(validForm);
    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]?.body as string) as Record<string, unknown>;
    expect(body.name).toBe("  Sarah Chen  ");
    expect(body.email).toBe(" sarah@company.com ");
  });

  it("throws RateLimitError on 429 with retryAfterMs from the response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Too many submissions.", retryAfterMs: 5 * 60 * 1000 }),
        { status: 429 },
      ),
    );
    const err = await submitQuote(validForm).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).retryAfterMs).toBe(5 * 60 * 1000);
    expect((err as RateLimitError).message).toContain("5 minutes");
  });

  it("throws RateLimitError on 429 even when retryAfterMs is absent", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Too many submissions." }), { status: 429 }),
    );
    const err = await submitQuote(validForm).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RateLimitError);
    expect((err as RateLimitError).message).toContain("try again shortly");
  });

  it("throws a plain Error (not RateLimitError) on 500 with the server message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 }),
    );
    const err = await submitQuote(validForm).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(RateLimitError);
    expect((err as Error).message).toBe("Internal server error");
  });

  it("falls back to a generic message when the 500 body has no error string", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("{}", { status: 500 }),
    );
    const err = await submitQuote(validForm).catch((e: unknown) => e);
    expect((err as Error).message).toBe("Failed to submit your request.");
  });
});
