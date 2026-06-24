import { describe, it, expect, vi, beforeEach } from "vitest";
import { writeBatch, addDoc } from "firebase/firestore";
import type { QuoteFormData } from "./quoteValidation";

// The real module pulls in Firebase app/analytics init; stub it out.
vi.mock("@/Firebase/firebase", () => ({ db: { __mock: true } }));

// vi.mock is hoisted, so variables declared outside the factory are not yet
// initialised when the factory runs. Declare all fns inside the factory and
// expose them through vi.mocked() after the imports instead.
vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn((_db: unknown, name: string) => name),
    doc: vi.fn((dbOrColl: unknown, ...args: string[]) => {
      if (typeof dbOrColl === "string") return { __doc: dbOrColl, id: args[0] || dbOrColl };
      return { __doc: args[0], id: args[0] };
    }),
    addDoc: vi.fn().mockResolvedValue({ id: "spam-x" }),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      commit: vi.fn(),
    })),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    serverTimestamp: vi.fn(() => "__ts__"),
  };
});

import {
  submitQuote,
  buildQuoteSummary,
  buildMailData,
  QUOTE_NOTIFY_EMAIL,
} from "./submitQuote";

// Retrieve the stable mock references AFTER the module is imported.
const mockWriteBatch = vi.mocked(writeBatch);
const mockAddDoc = vi.mocked(addDoc);

// Helper to get the batch object returned by the most recent writeBatch() call.
function lastBatch() {
  const calls = mockWriteBatch.mock.results;
  return calls[calls.length - 1]?.value as { set: ReturnType<typeof vi.fn>; commit: ReturnType<typeof vi.fn> } | undefined;
}

const validForm: QuoteFormData = {
  name: "  Sarah Chen  ",
  email: " sarah@company.com ",
  phone: "+1 555 123 4567",
  business: "TechStart Inc.",
  budget: "$5,000 – $10,000",
  type: "Business Website",
  description: "Need a new marketing site.",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildQuoteSummary", () => {
  it("trims fields and composes subject + text", () => {
    const s = buildQuoteSummary(validForm);
    expect(s.name).toBe("Sarah Chen");
    expect(s.email).toBe("sarah@company.com");
    expect(s.subject).toBe("New quote request: Business Website — TechStart Inc.");
    expect(s.text).toContain("Email: sarah@company.com");
    expect(s.text).toContain("Phone: +1 555 123 4567");
    expect(s.text).toContain("Budget: $5,000 – $10,000");
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

describe("submitQuote", () => {
  it("writes the lead to messages, mail, and rate_limits in a batch", async () => {
    await submitQuote(validForm);

    expect(mockWriteBatch).toHaveBeenCalledTimes(1);
    const batch = lastBatch()!;
    expect(batch.set).toHaveBeenCalledTimes(3); // messages, mail, rate_limits
    expect(batch.commit).toHaveBeenCalledTimes(1);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setCalls = (batch.set as any).mock.calls as [{ __doc?: string; id?: string }, Record<string, unknown>][];
    const messageCall = setCalls.find((c) => c[0].__doc === "messages");
    const mailCall    = setCalls.find((c) => c[0].__doc === "mail");
    const rateLimitCall = setCalls.find((c) => c[0].__doc === "rate_limits" || c[0].id === "rate_limits");

    expect(messageCall).toBeDefined();
    expect(mailCall).toBeDefined();
    expect(rateLimitCall).toBeDefined();

    const message = messageCall![1];
    expect(message.status).toBe("new");
    expect(message.createdAt).toBe("__ts__"); // serverTimestamp(), required by rules
    expect(message.name).toBe("Sarah Chen");
    expect(message.body).toBe(buildQuoteSummary(validForm).text);
    expect(message.subject).toBe(
      "New quote request: Business Website — TechStart Inc.",
    );

    const mail = mailCall![1];
    expect(mail.to).toEqual([QUOTE_NOTIFY_EMAIL]);
    expect(mail.createdAt).toBe("__ts__");
    expect(mail.sessionId).toBeDefined();
  });

  it("logs honeypot submissions to spam_logs and returns silently", async () => {
    await submitQuote(validForm, "bot-value");

    // Must NOT write a real lead
    expect(mockWriteBatch).not.toHaveBeenCalled();

    // Must log to spam_logs via addDoc
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
    const [collArg, dataArg] = mockAddDoc.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(collArg).toBe("spam_logs");
    expect(dataArg.honeypot).toBe("bot-value");
    expect(dataArg.sessionId).toBeDefined();
    expect(dataArg.createdAt).toBe("__ts__");
  });

  it("rejects when the batch commit fails (e.g. permission-denied)", async () => {
    // Make the commit() on the batch returned by writeBatch() reject
    const batch = { set: vi.fn(), commit: vi.fn().mockRejectedValueOnce({ code: "permission-denied" }) };
    mockWriteBatch.mockReturnValueOnce(batch as never);

    await expect(submitQuote(validForm)).rejects.toThrow("Too many submissions. Please wait a minute before trying again.");
    expect(batch.commit).toHaveBeenCalledTimes(1);
  });
});

