import { describe, it, expect, vi, beforeEach } from "vitest";
import { addDoc, collection } from "firebase/firestore";
import type { QuoteFormData } from "./quoteValidation";

// The real module pulls in Firebase app/analytics init; stub it out.
vi.mock("@/Firebase/firebase", () => ({ db: { __mock: true } }));
vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn((_db: unknown, name: string) => ({ __collection: name })),
  serverTimestamp: vi.fn(() => "__ts__"),
}));

import {
  submitQuote,
  buildQuoteSummary,
  buildMailData,
  QUOTE_NOTIFY_EMAIL,
} from "./submitQuote";

const mockedAddDoc = vi.mocked(addDoc);
const mockedCollection = vi.mocked(collection);

const validForm: QuoteFormData = {
  name: "  Sarah Chen  ",
  email: " sarah@company.com ",
  phone: "+1 555 123 4567",
  business: "TechStart Inc.",
  budget: "₹75,000 – ₹2,00,000",
  type: "Business Website",
  description: "Need a new marketing site.",
};

function collName(call: number): string {
  return (mockedAddDoc.mock.calls[call][0] as unknown as { __collection: string })
    .__collection;
}

function payload(call: number): Record<string, unknown> {
  return mockedAddDoc.mock.calls[call][1] as unknown as Record<string, unknown>;
}

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
  it("writes the lead to messages, then queues the email to mail", async () => {
    mockedAddDoc.mockResolvedValue({ id: "x" } as never);
    await submitQuote(validForm);

    expect(mockedAddDoc).toHaveBeenCalledTimes(2);
    expect(collName(0)).toBe("messages");
    expect(collName(1)).toBe("mail");

    const message = payload(0);
    expect(message.status).toBe("new");
    expect(message.createdAt).toBe("__ts__"); // serverTimestamp(), required by rules
    expect(message.name).toBe("Sarah Chen");
    // body + subject are rule-load-bearing on the `messages` write — pin the mapping.
    expect(message.body).toBe(buildQuoteSummary(validForm).text);
    expect(message.subject).toBe(
      "New quote request: Business Website — TechStart Inc.",
    );

    const mail = payload(1);
    expect(mail.to).toEqual([QUOTE_NOTIFY_EMAIL]);
    expect(mail.createdAt).toBe("__ts__");

    expect(mockedCollection).toHaveBeenCalledWith({ __mock: true }, "messages");
  });

  it("still resolves when the email queue write fails (lead is already saved)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockedAddDoc
      .mockResolvedValueOnce({ id: "msg" } as never) // messages OK
      .mockRejectedValueOnce(new Error("mail rule not deployed")); // mail fails

    await expect(submitQuote(validForm)).resolves.toBeUndefined();
    expect(mockedAddDoc).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("rejects when the lead itself cannot be persisted", async () => {
    mockedAddDoc.mockRejectedValueOnce(new Error("permission-denied"));
    await expect(submitQuote(validForm)).rejects.toThrow("permission-denied");
    expect(mockedAddDoc).toHaveBeenCalledTimes(1); // never tries to email
  });
});
