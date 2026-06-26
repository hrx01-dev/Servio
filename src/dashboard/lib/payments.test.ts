/**
 * payments.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the client project-payments helpers (issue #178). These pin the
 * contract the Firestore subscription relies on: case-insensitive addressing,
 * dropping malformed payment entries, conservative status defaulting, derived
 * amount-paid / remaining / percentage figures, and newest-first order.
 *
 * Run with: npx vitest run src/dashboard/lib/payments.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  computeBilling,
  normalizeEmail,
  parseClientBilling,
  parseClientPayment,
  sortPaymentsByNewest,
  type ClientPayment,
} from "./payments";

describe("normalizeEmail", () => {
  it("lowercases and trims so addressing is case/whitespace-insensitive", () => {
    expect(normalizeEmail("  Client@Example.COM ")).toBe("client@example.com");
  });
});

describe("parseClientPayment", () => {
  const base = {
    id: "p1",
    amount: 10000,
    method: "Bank Transfer",
    reference: "TXN-2026-001",
    status: "completed",
    date: "2026-05-01",
  };

  it("parses a well-formed entry and converts the date", () => {
    const p = parseClientPayment(base);
    expect(p).not.toBeNull();
    expect(p).toMatchObject({
      id: "p1",
      amount: 10000,
      method: "Bank Transfer",
      reference: "TXN-2026-001",
      status: "completed",
    });
    expect(p!.date?.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("drops an entry without a usable amount", () => {
    expect(parseClientPayment({ ...base, amount: "abc" })).toBeNull();
    expect(parseClientPayment({ ...base, amount: -5 })).toBeNull();
    expect(parseClientPayment({ ...base, amount: undefined })).toBeNull();
    expect(parseClientPayment(null)).toBeNull();
  });

  it("coerces a numeric-string amount", () => {
    expect(parseClientPayment({ ...base, amount: "2500" })?.amount).toBe(2500);
  });

  it("defaults an unknown/absent status to 'pending' (never inflates paid)", () => {
    expect(parseClientPayment({ ...base, status: "refunded" })?.status).toBe(
      "pending",
    );
    expect(parseClientPayment({ ...base, status: undefined })?.status).toBe(
      "pending",
    );
  });

  it("synthesises a stable id from the index when missing", () => {
    expect(parseClientPayment({ ...base, id: undefined }, 3)?.id).toBe(
      "payment-3",
    );
  });

  it("tolerates an absent/invalid date", () => {
    expect(parseClientPayment({ ...base, date: undefined })?.date).toBeNull();
    const p = parseClientPayment({ ...base, date: null });
    expect(p).not.toBeNull();
    expect(p!.date).toBeNull();
  });
});

describe("computeBilling", () => {
  const make = (amount: number, status: ClientPayment["status"]): ClientPayment => ({
    id: `${amount}-${status}`,
    amount,
    method: "",
    reference: "",
    status,
    date: null,
  });

  it("sums only completed payments toward amountPaid", () => {
    const { amountPaid } = computeBilling(30000, [
      make(10000, "completed"),
      make(5000, "completed"),
      make(8000, "pending"),
      make(2000, "failed"),
    ]);
    expect(amountPaid).toBe(15000);
  });

  it("computes remaining and percentage from the completed total", () => {
    const r = computeBilling(30000, [make(15000, "completed")]);
    expect(r.remaining).toBe(15000);
    expect(r.paidPercent).toBe(50);
  });

  it("never goes negative or above 100% when overpaid", () => {
    const r = computeBilling(10000, [make(15000, "completed")]);
    expect(r.remaining).toBe(0);
    expect(r.paidPercent).toBe(100);
  });

  it("yields 0% (not NaN) when the total cost is zero", () => {
    const r = computeBilling(0, [make(5000, "completed")]);
    expect(r.paidPercent).toBe(0);
    expect(r.remaining).toBe(0);
  });
});

describe("sortPaymentsByNewest", () => {
  const make = (id: string, ms: number | null): ClientPayment => ({
    id,
    amount: 0,
    method: "",
    reference: "",
    status: "completed",
    date: ms == null ? null : new Date(ms),
  });

  it("orders newest first and pushes date-less payments to the end", () => {
    const ordered = [
      make("old", 1000),
      make("new", 5000),
      make("undated", null),
    ].sort(sortPaymentsByNewest);
    expect(ordered.map((p) => p.id)).toEqual(["new", "old", "undated"]);
  });
});

describe("parseClientBilling", () => {
  it("parses a document, filters bad payments, sorts, and derives figures", () => {
    const billing = parseClientBilling({
      clientEmail: "client@example.com",
      totalCost: 30000,
      payments: [
        { id: "a", amount: 10000, status: "completed", date: "2026-05-01" },
        { id: "b", amount: 5000, status: "completed", date: "2026-06-01" },
        { id: "bad", amount: "n/a", status: "completed" },
      ],
    });
    expect(billing).not.toBeNull();
    expect(billing!.totalCost).toBe(30000);
    expect(billing!.payments.map((p) => p.id)).toEqual(["b", "a"]); // newest first
    expect(billing!.amountPaid).toBe(15000);
    expect(billing!.remaining).toBe(15000);
    expect(billing!.paidPercent).toBe(50);
  });

  it("returns null when there is no cost and no valid payments", () => {
    expect(parseClientBilling({ clientEmail: "x@y.com" })).toBeNull();
    expect(
      parseClientBilling({ totalCost: 0, payments: [{ amount: "bad" }] }),
    ).toBeNull();
  });

  it("shows a cost-only project (no payments yet) as 0% paid", () => {
    const billing = parseClientBilling({ totalCost: 50000, payments: [] });
    expect(billing).not.toBeNull();
    expect(billing!.amountPaid).toBe(0);
    expect(billing!.remaining).toBe(50000);
    expect(billing!.paidPercent).toBe(0);
  });
});
