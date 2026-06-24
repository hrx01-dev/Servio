import { describe, it, expect, vi, beforeEach } from "vitest";
import { collection, doc, writeBatch, getDoc } from "firebase/firestore";
import type { QuoteFormData } from "./quoteValidation";

// The real module pulls in Firebase app/analytics init; stub it out.
vi.mock("@/Firebase/firebase", () => ({ db: { __mock: true } }));

const mockSet = vi.fn();
const mockCommit = vi.fn();

vi.mock("firebase/firestore", () => {
  return {
    collection: vi.fn((_db: unknown, name: string) => name),
    doc: vi.fn((dbOrColl: any, ...args: string[]) => {
      if (typeof dbOrColl === "string") return { __doc: dbOrColl, id: args[0] || dbOrColl };
      return { __doc: args[0], id: args[0] };
    }),
    writeBatch: vi.fn(() => ({
      set: mockSet,
      commit: mockCommit,
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
    mockCommit.mockResolvedValueOnce(undefined);
    await submitQuote(validForm);

    expect(writeBatch).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledTimes(3); // messages, mail, rate_limits
    expect(mockCommit).toHaveBeenCalledTimes(1);

    const messageCall = mockSet.mock.calls.find((c) => c[0].__doc === "messages");
    const mailCall = mockSet.mock.calls.find((c) => c[0].__doc === "mail");
    const rateLimitCall = mockSet.mock.calls.find((c) => c[0].id === "rate_limits" || c[0].__doc === "rate_limits");

    expect(messageCall).toBeDefined();
    expect(mailCall).toBeDefined();
    expect(rateLimitCall).toBeDefined();

    const message = messageCall[1];
    expect(message.status).toBe("new");
    expect(message.createdAt).toBe("__ts__"); // serverTimestamp(), required by rules
    expect(message.name).toBe("Sarah Chen");
    expect(message.body).toBe(buildQuoteSummary(validForm).text);
    expect(message.subject).toBe(
      "New quote request: Business Website — TechStart Inc.",
    );

    const mail = mailCall[1];
    expect(mail.to).toEqual([QUOTE_NOTIFY_EMAIL]);
    expect(mail.createdAt).toBe("__ts__");
    expect(mail.sessionId).toBeDefined(); // sessionId is included now
  });

  it("silently rejects honeypot submissions", async () => {
    await submitQuote(validForm, "bot-value");
    
    // Should return early and not call writeBatch
    expect(writeBatch).not.toHaveBeenCalled();
    expect(mockCommit).not.toHaveBeenCalled();
  });

  it("rejects when the batch fails (e.g. permission-denied)", async () => {
    mockCommit.mockRejectedValueOnce({ code: "permission-denied" });
    await expect(submitQuote(validForm)).rejects.toThrow("Too many submissions. Please wait a minute before trying again.");
    expect(mockCommit).toHaveBeenCalledTimes(1);
  });
});
