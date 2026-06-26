// Pure, dependency-free helpers for the client "project payments" view. Kept
// free of any Firebase import so it stays trivially unit-testable; the service
// layer (paymentsService.ts) wires these to a Firestore subscription.
//
// The client dashboard's Payments section reads a single, admin-authored
// `projectBilling` document addressed to the signed-in client (by their verified
// email). That document holds the project's total cost and the list of recorded
// payments; the amount-paid, remaining-balance and percentage figures are all
// DERIVED here from the completed payments — never stored — so they can never
// drift out of sync with the underlying transactions.

export const PAYMENT_STATUSES = ["completed", "pending", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** A single payment transaction as consumed by the client dashboard. */
export interface ClientPayment {
  id: string;
  /** Amount in the project's currency (INR). Always a finite number ≥ 0. */
  amount: number;
  /** How the payment was made, e.g. "Bank Transfer", "UPI". */
  method: string;
  /** Transaction / reference id. May be empty. */
  reference: string;
  status: PaymentStatus;
  /** The date the payment was made; null when absent/unparseable. */
  date: Date | null;
}

/** The client's billing summary: stored total cost + derived figures. */
export interface ClientBilling {
  totalCost: number;
  /** Sum of COMPLETED payments — the money actually received. */
  amountPaid: number;
  /** totalCost − amountPaid (clamped at 0 so overpayment never shows negative). */
  remaining: number;
  /** Percentage of the total cost paid, clamped to 0…100. */
  paidPercent: number;
  /** Recorded payments, newest first. */
  payments: ClientPayment[];
}

/** Lowercase + trim so the addressee match is case/whitespace-insensitive. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}

// Duck-typed conversion of a Firestore Timestamp (or Date / millis / ISO or
// 'YYYY-MM-DD' string) into a Date. Duck-typing keeps this module free of the
// Firebase SDK so it can be unit-tested without initializing an app.
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

/**
 * Parse a raw payment entry into a `ClientPayment`. Entries without a usable
 * amount are dropped — returning null — rather than rendered as ₹NaN rows. An
 * unknown/absent `status` degrades to "pending" so it can never silently inflate
 * the amount-paid figure (only "completed" payments count toward it).
 */
export function parseClientPayment(
  raw: unknown,
  index = 0,
): ClientPayment | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const amount = toAmount(data.amount);
  if (amount === null) return null;
  return {
    id: typeof data.id === "string" && data.id ? data.id : `payment-${index}`,
    amount,
    method: typeof data.method === "string" ? data.method.trim() : "",
    reference: typeof data.reference === "string" ? data.reference.trim() : "",
    status: isPaymentStatus(data.status) ? data.status : "pending",
    date: toDate(data.date),
  };
}

/** Newest first; payments with no resolved date sort to the end. */
export function sortPaymentsByNewest(a: ClientPayment, b: ClientPayment): number {
  const at = a.date ? a.date.getTime() : 0;
  const bt = b.date ? b.date.getTime() : 0;
  return bt - at;
}

/**
 * Derive the amount-paid, remaining-balance and percentage figures from a total
 * cost and a list of payments. Only COMPLETED payments count as paid. The
 * percentage is clamped to 0…100 and `remaining` never goes negative, so the
 * UI's progress bar and balance stay sensible even if payments exceed the cost.
 */
export function computeBilling(
  totalCost: number,
  payments: ClientPayment[],
): Pick<ClientBilling, "amountPaid" | "remaining" | "paidPercent"> {
  const safeTotal = Number.isFinite(totalCost) && totalCost > 0 ? totalCost : 0;
  const amountPaid = payments.reduce(
    (sum, p) => (p.status === "completed" ? sum + p.amount : sum),
    0,
  );
  const remaining = Math.max(safeTotal - amountPaid, 0);
  const paidPercent =
    safeTotal > 0
      ? Math.min(100, Math.max(0, Math.round((amountPaid / safeTotal) * 100)))
      : 0;
  return { amountPaid, remaining, paidPercent };
}

/**
 * Parse a raw `projectBilling` document into a `ClientBilling`, dropping
 * malformed payment entries and computing the derived figures. Returns null only
 * when there is genuinely nothing to show (no cost and no valid payments) so the
 * caller can render an empty state.
 */
export function parseClientBilling(
  data: Record<string, unknown>,
): ClientBilling | null {
  const totalCost = toAmount(data.totalCost) ?? 0;
  const rawPayments = Array.isArray(data.payments) ? data.payments : [];
  const payments = rawPayments
    .map((entry, i) => parseClientPayment(entry, i))
    .filter((p): p is ClientPayment => p !== null)
    .sort(sortPaymentsByNewest);

  if (totalCost <= 0 && payments.length === 0) return null;

  return {
    totalCost,
    payments,
    ...computeBilling(totalCost, payments),
  };
}
