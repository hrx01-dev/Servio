/**
 * invoices.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the client invoice helpers (issue #165): case-insensitive
 * addressing, tolerant parsing, status defaulting, derived totals, and
 * newest-first ordering.
 *
 * Run with: npx vitest run src/dashboard/lib/invoices.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  computeTotal,
  normalizeEmail,
  parseClientInvoice,
  parseInvoiceItem,
  sortByNewest,
  type ClientInvoice,
} from "./invoices";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Client@Example.COM ")).toBe("client@example.com");
  });
});

describe("parseInvoiceItem", () => {
  it("parses a valid item and drops one without a usable amount", () => {
    expect(parseInvoiceItem({ description: "Design", amount: 5000 })).toEqual({
      description: "Design",
      amount: 5000,
    });
    expect(parseInvoiceItem({ description: "x", amount: "n/a" })).toBeNull();
    expect(parseInvoiceItem(null)).toBeNull();
  });
});

describe("computeTotal", () => {
  it("sums line-item amounts", () => {
    expect(
      computeTotal([
        { description: "a", amount: 5000 },
        { description: "b", amount: 2500 },
      ]),
    ).toBe(7500);
    expect(computeTotal([])).toBe(0);
  });
});

describe("parseClientInvoice", () => {
  const base = {
    number: "INV-2026-001",
    date: "2026-05-01",
    dueDate: "2026-05-15",
    status: "paid",
    items: [
      { description: "Setup", amount: 5000 },
      { description: "Design", amount: 5000 },
    ],
  };

  it("parses a well-formed invoice and derives the total", () => {
    const inv = parseClientInvoice("a", base);
    expect(inv).not.toBeNull();
    expect(inv).toMatchObject({ id: "a", number: "INV-2026-001", status: "paid" });
    expect(inv!.total).toBe(10000);
    expect(inv!.date?.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });

  it("drops an invoice with no number", () => {
    expect(parseClientInvoice("b", { ...base, number: "  " })).toBeNull();
    expect(parseClientInvoice("c", { ...base, number: undefined })).toBeNull();
  });

  it("degrades an unknown status to 'unpaid'", () => {
    expect(parseClientInvoice("d", { ...base, status: "void" })?.status).toBe(
      "unpaid",
    );
  });

  it("drops malformed items and totals the rest", () => {
    const inv = parseClientInvoice("e", {
      ...base,
      items: [
        { description: "ok", amount: 3000 },
        { description: "bad", amount: "x" },
      ],
    });
    expect(inv!.items).toHaveLength(1);
    expect(inv!.total).toBe(3000);
  });

  it("tolerates an absent date/dueDate", () => {
    const inv = parseClientInvoice("f", { ...base, date: undefined, dueDate: null });
    expect(inv!.date).toBeNull();
    expect(inv!.dueDate).toBeNull();
  });
});

describe("sortByNewest", () => {
  const make = (id: string, ms: number | null): ClientInvoice => ({
    id,
    number: id,
    status: "paid",
    items: [],
    total: 0,
    date: ms == null ? null : new Date(ms),
    dueDate: null,
  });

  it("orders newest first and pushes undated invoices to the end", () => {
    const ordered = [
      make("old", 1000),
      make("new", 5000),
      make("undated", null),
    ].sort(sortByNewest);
    expect(ordered.map((i) => i.id)).toEqual(["new", "old", "undated"]);
  });
});
