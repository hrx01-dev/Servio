import { useEffect, useMemo, useState } from "react";
import { IndianRupee, Pencil, Plus, Trash2, Users, Wallet } from "lucide-react";
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/Firebase/firebase";
import { isTyping } from "../lib/keyboard";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/app/components/ui/utils";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { EmptyState } from "../components/EmptyState";
import { useAdmin } from "../context/useAdmin";
import { useClients, useProjectBilling } from "../hooks/useAdminData";
import { writeAuditLog } from "../lib/audit";
import { COLLECTIONS } from "../lib/collections";
import { formatCurrency, formatDate } from "../lib/format";
import type { PaymentStatus, ProjectBilling, ProjectPayment } from "../types";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/app/components/UnsavedChangesDialog";

const STATUS_OPTIONS: readonly PaymentStatus[] = [
  "completed",
  "pending",
  "failed",
];

const STATUS_LABELS: Record<PaymentStatus, string> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};

const STATUS_PILL_CLASSES: Record<PaymentStatus, string> = {
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const METHOD_SUGGESTIONS = [
  "Bank Transfer",
  "UPI",
  "Credit Card",
  "Debit Card",
  "Cash",
  "Cheque",
];

// Excludes '/' as well as whitespace/'@': the lowercased email is used directly
// as the Firestore document id, and '/' would be parsed as a path separator.
const EMAIL_RE = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

const inputClasses =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40";

/** Sum of completed payments — the money actually received. */
function paidTotal(payments: { amount: number; status: PaymentStatus }[]): number {
  return payments.reduce(
    (sum, p) => (p.status === "completed" ? sum + p.amount : sum),
    0,
  );
}

function newPaymentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `pay-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Editable draft of a payment row (amount kept as a raw input string). */
interface PaymentDraft {
  id: string;
  date: string;
  amount: string;
  method: string;
  reference: string;
  status: PaymentStatus;
}

function emptyPaymentDraft(): PaymentDraft {
  return {
    id: newPaymentId(),
    date: "",
    amount: "",
    method: "",
    reference: "",
    status: "completed",
  };
}

function StatusPill({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_PILL_CLASSES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function ProjectBilling() {
  const { admin, can } = useAdmin();
  const billing = useProjectBilling();
  const clients = useClients();
  const canEdit = can("projects:edit");
  const { markDirty, markClean, blocker } = useUnsavedChanges();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  /** The id of the record being edited, or null when creating a new one. */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [payments, setPayments] = useState<PaymentDraft[]>([]);

  // Known client emails power the composer's autocomplete datalist.
  const clientEmailOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of clients.data) {
      const email = c.email.trim().toLowerCase();
      if (email) seen.add(email);
    }
    return [...seen].sort();
  }, [clients.data]);

  // "N" opens the create dialog (skip when typing in a field, or when a dialog
  // is already open — otherwise it would wipe an in-progress edit).
  useEffect(() => {
    if (!canEdit) return;
    function handleKey(e: KeyboardEvent) {
      if (isTyping(e) || dialogOpen) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        // Inlined (stable setters only) so the effect needn't depend on the
        // openCreate closure.
        setEditingId(null);
        setClientEmail("");
        setTotalCost("");
        setPayments([emptyPaymentDraft()]);
        setDialogOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canEdit, dialogOpen]);

  function resetForm() {
    setEditingId(null);
    setClientEmail("");
    setTotalCost("");
    setPayments([]);
    markClean();
  }

  function openCreate() {
    setEditingId(null);
    setClientEmail("");
    setTotalCost("");
    setPayments([emptyPaymentDraft()]);
    setDialogOpen(true);
  }

  function openEdit(record: ProjectBilling) {
    setEditingId(record.id);
    setClientEmail(record.clientEmail);
    setTotalCost(String(record.totalCost));
    setPayments(
      record.payments.map((p) => ({
        id: p.id,
        date: p.date,
        amount: String(p.amount),
        method: p.method,
        reference: p.reference,
        status: p.status,
      })),
    );
    setDialogOpen(true);
  }

  function patchPayment(id: string, patch: Partial<PaymentDraft>) {
    markDirty();
    setPayments((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addPaymentRow() {
    markDirty();
    setPayments((rows) => [...rows, emptyPaymentDraft()]);
  }

  function removePaymentRow(id: string) {
    markDirty();
    setPayments((rows) => rows.filter((row) => row.id !== id));
  }

  async function handleSave() {
    if (!admin) return;
    const email = clientEmail.trim().toLowerCase();

    if (!EMAIL_RE.test(email)) {
      toast.error("Enter a valid client email.");
      return;
    }

    const cost = Number(totalCost);
    // Upper bound mirrors the `totalCost < 1e12` cap in firestore.rules so the
    // admin gets a clear message instead of a generic write-rejected error.
    if (!Number.isFinite(cost) || cost < 0 || cost >= 1_000_000_000_000) {
      toast.error("Enter a valid total cost (₹0 or more, below ₹1 trillion).");
      return;
    }

    // Build the stored payments. A row is only ignored when it is ENTIRELY
    // blank; a row with any detail but no valid amount is a mistake, so surface
    // it rather than silently dropping the admin's input.
    const cleaned: ProjectPayment[] = [];
    for (let i = 0; i < payments.length; i++) {
      const d = payments[i];
      const isBlank =
        d.amount.trim() === "" &&
        d.date.trim() === "" &&
        d.method.trim() === "" &&
        d.reference.trim() === "";
      if (isBlank) continue;
      const amount = Number(d.amount);
      if (d.amount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
        toast.error(`Payment ${i + 1} needs a valid amount (₹0 or more).`);
        return;
      }
      cleaned.push({
        id: d.id,
        date: d.date,
        amount,
        method: d.method.trim(),
        reference: d.reference.trim(),
        status: d.status,
      });
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, COLLECTIONS.projectBilling, editingId), {
          totalCost: cost,
          payments: cleaned,
          updatedAt: serverTimestamp(),
        });
      } else {
        // One billing document per client; the doc id IS the lowercased email,
        // so guard against silently overwriting an existing client's record.
        const existing = billing.data.find((b) => b.clientEmail === email);
        if (existing) {
          toast.error(
            "This client already has billing — edit the existing record instead.",
          );
          setSubmitting(false);
          return;
        }
        await setDoc(doc(db, COLLECTIONS.projectBilling, email), {
          clientEmail: email,
          totalCost: cost,
          payments: cleaned,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: editingId ? "project_billing.update" : "project_billing.create",
        targetType: "projectBilling",
        targetId: editingId ?? email,
        metadata: { clientEmail: email, totalCost: cost, payments: cleaned.length },
      });

      resetForm();
      setDialogOpen(false);
      toast.success(
        editingId ? "Billing updated." : "Billing created for the client.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save the billing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(record: ProjectBilling) {
    if (!admin) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.projectBilling, record.id));
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "project_billing.delete",
        targetType: "projectBilling",
        targetId: record.id,
        metadata: { clientEmail: record.clientEmail },
      });
      toast.success("Billing removed.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't remove the billing. Please try again.");
    }
  }

  const clientsBilled = billing.data.length;
  const totalInvoiced = useMemo(
    () => billing.data.reduce((sum, b) => sum + b.totalCost, 0),
    [billing.data],
  );
  const totalCollected = useMemo(
    () => billing.data.reduce((sum, b) => sum + paidTotal(b.payments), 0),
    [billing.data],
  );

  const addButton = canEdit ? (
    <div className="flex items-center gap-2">
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add billing
      </Button>
      <kbd className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-border sm:inline">
        N
      </kbd>
    </div>
  ) : null;

  return (
    <div className="space-y-8">
      <UnsavedChangesDialog blocker={blocker} />
      <PageHeader
        title="Client Billing"
        description="Set each client's project cost and record payments. These appear on the client's dashboard Payments section, addressed by their account email."
        actions={addButton}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Clients billed"
          value={billing.loading ? "…" : clientsBilled}
        />
        <StatCard
          icon={IndianRupee}
          label="Total invoiced"
          value={billing.loading ? "…" : formatCurrency(totalInvoiced)}
        />
        <StatCard
          icon={Wallet}
          label="Total collected"
          value={billing.loading ? "…" : formatCurrency(totalCollected)}
        />
      </div>

      {billing.loading ? (
        <p className="text-sm text-muted-foreground">Loading billing…</p>
      ) : billing.error ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t load billing: {billing.error}
        </p>
      ) : billing.data.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No billing set up yet"
          description="Add a client's project cost and payments to populate their dashboard."
          action={addButton}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Total cost</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                  <th className="px-4 py-3 font-medium">Remaining</th>
                  <th className="px-4 py-3 font-medium">Payments</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {billing.data.map((record) => {
                  const paid = paidTotal(record.payments);
                  const remaining = Math.max(record.totalCost - paid, 0);
                  return (
                    <tr key={record.id} className="align-top">
                      <td className="px-4 py-3 text-muted-foreground">
                        {record.clientEmail}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatCurrency(record.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(paid)}
                      </td>
                      <td className="px-4 py-3 text-amber-600 dark:text-amber-400">
                        {formatCurrency(remaining)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {record.payments.length}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(record.updatedAt ?? record.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEdit(record)}
                                aria-label={`Edit billing for ${record.clientEmail}`}
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => void handleDelete(record)}
                                aria-label={`Delete billing for ${record.clientEmail}`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit billing" : "Add billing"}
            </DialogTitle>
            <DialogDescription>
              The client signed in with this email sees the cost, progress, and
              payment history on their dashboard&apos;s Payments section.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="billing-client"
                  className="text-sm font-medium text-foreground"
                >
                  Client email
                </label>
                <input
                  id="billing-client"
                  type="email"
                  list="admin-client-emails"
                  value={clientEmail}
                  onChange={(e) => {
                    markDirty();
                    setClientEmail(e.target.value);
                  }}
                  required
                  disabled={editingId !== null}
                  className={cn(inputClasses, "disabled:opacity-60")}
                  placeholder="client@example.com"
                />
                {editingId !== null && (
                  <p className="text-xs text-muted-foreground">
                    The email is the record key and can&apos;t be changed. Delete
                    and re-create to move billing to a different email.
                  </p>
                )}
                <datalist id="admin-client-emails">
                  {clientEmailOptions.map((email) => (
                    <option key={email} value={email} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="billing-total"
                  className="text-sm font-medium text-foreground"
                >
                  Total project cost (₹)
                </label>
                <input
                  id="billing-total"
                  type="number"
                  min={0}
                  step="1"
                  value={totalCost}
                  onChange={(e) => {
                    markDirty();
                    setTotalCost(e.target.value);
                  }}
                  required
                  className={inputClasses}
                  placeholder="30000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Payments
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPaymentRow}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add payment
                </Button>
              </div>

              {payments.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  No payments yet. Add one as you record it, or save with none to
                  show the cost and a 0% progress bar.
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((row, idx) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-border p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Payment {idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePaymentRow(row.id)}
                          aria-label={`Remove payment ${idx + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label
                            htmlFor={`pay-date-${row.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Date
                          </label>
                          <input
                            id={`pay-date-${row.id}`}
                            type="date"
                            value={row.date}
                            onChange={(e) =>
                              patchPayment(row.id, { date: e.target.value })
                            }
                            className={inputClasses}
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`pay-amount-${row.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Amount (₹)
                          </label>
                          <input
                            id={`pay-amount-${row.id}`}
                            type="number"
                            min={0}
                            step="1"
                            value={row.amount}
                            onChange={(e) =>
                              patchPayment(row.id, { amount: e.target.value })
                            }
                            className={inputClasses}
                            placeholder="10000"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`pay-method-${row.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Method
                          </label>
                          <input
                            id={`pay-method-${row.id}`}
                            list="admin-payment-methods"
                            value={row.method}
                            onChange={(e) =>
                              patchPayment(row.id, { method: e.target.value })
                            }
                            className={inputClasses}
                            placeholder="Bank Transfer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`pay-reference-${row.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Reference
                          </label>
                          <input
                            id={`pay-reference-${row.id}`}
                            value={row.reference}
                            onChange={(e) =>
                              patchPayment(row.id, { reference: e.target.value })
                            }
                            className={inputClasses}
                            placeholder="TXN-2026-001"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label
                            htmlFor={`pay-status-${row.id}`}
                            className="text-xs text-muted-foreground"
                          >
                            Status
                          </label>
                          <select
                            id={`pay-status-${row.id}`}
                            value={row.status}
                            onChange={(e) =>
                              patchPayment(row.id, {
                                status: e.target.value as PaymentStatus,
                              })
                            }
                            className={inputClasses}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                          <div className="pt-1">
                            <StatusPill status={row.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <datalist id="admin-payment-methods">
                {METHOD_SUGGESTIONS.map((method) => (
                  <option key={method} value={method} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Only <span className="font-medium">Completed</span> payments count
                toward the client&apos;s amount-paid total. Blank rows are
                ignored on save.
              </p>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || !clientEmail.trim()}>
                {submitting
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create billing"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
