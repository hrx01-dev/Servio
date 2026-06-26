// Pure, dependency-free helpers for the client "invoices" view. Kept free of any
// Firebase import so it stays trivially unit-testable; the service layer
// (invoicesService.ts) wires these to a Firestore subscription.
//
// The client dashboard reads real, admin-authored invoices from the
// `projectInvoices` collection, addressed to the signed-in client by their
// verified email. Each invoice's total is DERIVED here from its line items —
// never stored — so it can never drift out of sync with the breakdown.

export const INVOICE_STATUSES = ["paid", "unpaid", "overdue"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

/** An admin-authored invoice as consumed by the client dashboard. */
export interface ClientInvoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  /** Sum of the line-item amounts. */
  total: number;
  /** Issue date; null when absent/unparseable. */
  date: Date | null;
  /** Due date; null when absent/unparseable. */
  dueDate: Date | null;
}

/** Lowercase + trim so the addressee match is case/whitespace-insensitive. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return (
    typeof value === "string" &&
    (INVOICE_STATUSES as readonly string[]).includes(value)
  );
}

// Duck-typed conversion of a Firestore Timestamp (or Date / millis / ISO or
// 'YYYY-MM-DD' string) into a Date, keeping this module free of the Firebase SDK.
function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "object") {
    const ts = value as {
      toDate?: () => Date;
      toMillis?: () => number;
      seconds?: number;
    };
    if (typeof ts.toDate === "function") {
      try {
        const d = ts.toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
      } catch {
        /* fall through */
      }
    }
    if (typeof ts.toMillis === "function") {
      try {
        const d = new Date(ts.toMillis());
        return Number.isNaN(d.getTime()) ? null : d;
      } catch {
        /* fall through */
      }
    }
    if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  }
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Coerce to a finite, non-negative number; returns null if it can't. */
function toAmount(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Parse one raw line item; drops entries without a usable amount. */
export function parseInvoiceItem(raw: unknown): InvoiceLineItem | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const amount = toAmount(data.amount);
  if (amount === null) return null;
  return {
    description:
      typeof data.description === "string" ? data.description.trim() : "",
    amount,
  };
}

/** Sum the line-item amounts. */
export function computeTotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

/**
 * Parse a raw `projectInvoices` document into a `ClientInvoice`. Documents
 * without an invoice number are dropped (returning null) rather than rendered as
 * blank cards. An unknown `status` degrades to "unpaid"; the total is derived
 * from the (filtered) line items.
 */
export function parseClientInvoice(
  id: string,
  data: Record<string, unknown>,
): ClientInvoice | null {
  const number = typeof data.number === "string" ? data.number.trim() : "";
  if (!number) return null;
  const items = Array.isArray(data.items)
    ? data.items
        .map(parseInvoiceItem)
        .filter((i): i is InvoiceLineItem => i !== null)
    : [];
  return {
    id,
    number,
    status: isInvoiceStatus(data.status) ? data.status : "unpaid",
    items,
    total: computeTotal(items),
    date: toDate(data.date),
    dueDate: toDate(data.dueDate),
  };
}

/** Newest first by issue date; undated invoices sort to the end. */
export function sortByNewest(a: ClientInvoice, b: ClientInvoice): number {
  const at = a.date ? a.date.getTime() : 0;
  const bt = b.date ? b.date.getTime() : 0;
  return bt - at;
}
