import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  IndianRupee,
  CheckCircle2,
  Clock,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
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
import { useClients, useProjectInvoices } from "../hooks/useAdminData";
import { writeAuditLog } from "../lib/audit";
import { COLLECTIONS, projectInvoicesCollection } from "../lib/collections";
import { formatCurrency } from "../lib/format";
import type { InvoiceLineItem, InvoiceStatus, ProjectInvoice } from "../types";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/app/components/UnsavedChangesDialog";

const STATUS_OPTIONS: readonly InvoiceStatus[] = ["unpaid", "paid", "overdue"];
const STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: "Paid",
  unpaid: "Unpaid",
  overdue: "Overdue",
};
const STATUS_PILL_CLASSES: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  unpaid: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const EMAIL_RE = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;
const inputClasses =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40";

/** Sum of line-item amounts — the invoice total (derived, never stored). */
function invoiceTotal(items: InvoiceLineItem[]): number {
  return items.reduce((sum, i) => sum + (i.amount || 0), 0);
}

function newItemId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

interface ItemDraft {
  id: string;
  description: string;
  amount: string;
}

function emptyItemDraft(): ItemDraft {
  return { id: newItemId(), description: "", amount: "" };
}

function StatusPill({ status }: { status: InvoiceStatus }) {
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

export function ProjectInvoices() {
  const { admin, can } = useAdmin();
  const invoices = useProjectInvoices();
  const clients = useClients();
  const canEdit = can("projects:edit");
  const { markDirty, markClean, blocker } = useUnsavedChanges();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("unpaid");
  const [items, setItems] = useState<ItemDraft[]>([]);

  const clientEmailOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of clients.data) {
      const email = c.email.trim().toLowerCase();
      if (email) seen.add(email);
    }
    return [...seen].sort();
  }, [clients.data]);

  const total = invoices.data.length;
  const paidCount = invoices.data.filter((i) => i.status === "paid").length;
  const outstanding = invoices.data
    .filter((i) => i.status !== "paid")
    .reduce((sum, i) => sum + invoiceTotal(i.items), 0);

  function resetForm() {
    setEditingId(null);
    setClientEmail("");
    setNumber("");
    setDate("");
    setDueDate("");
    setStatus("unpaid");
    setItems([]);
    markClean();
  }

  function openCreate() {
    resetForm();
    setItems([emptyItemDraft()]);
    setDialogOpen(true);
  }

  function openEdit(invoice: ProjectInvoice) {
    setEditingId(invoice.id);
    setClientEmail(invoice.clientEmail);
    setNumber(invoice.number);
    setDate(invoice.date);
    setDueDate(invoice.dueDate);
    setStatus(invoice.status);
    setItems(
      invoice.items.map((i) => ({
        id: newItemId(),
        description: i.description,
        amount: String(i.amount),
      })),
    );
    setDialogOpen(true);
  }

  useEffect(() => {
    if (!canEdit) return;
    function handleKey(e: KeyboardEvent) {
      if (isTyping(e) || dialogOpen) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openCreate();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, dialogOpen]);

  function patchItem(id: string, patch: Partial<ItemDraft>) {
    markDirty();
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addItemRow() {
    markDirty();
    setItems((rows) => [...rows, emptyItemDraft()]);
  }
  function removeItemRow(id: string) {
    markDirty();
    setItems((rows) => rows.filter((r) => r.id !== id));
  }

  async function handleSave() {
    if (!admin) return;
    const email = clientEmail.trim().toLowerCase();
    const trimmedNumber = number.trim();

    if (!EMAIL_RE.test(email)) {
      toast.error("Enter a valid client email.");
      return;
    }
    if (!trimmedNumber) {
      toast.error("An invoice number is required.");
      return;
    }

    const cleaned: InvoiceLineItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const d = items[i];
      const isBlank = d.amount.trim() === "" && d.description.trim() === "";
      if (isBlank) continue;
      const amount = Number(d.amount);
      if (d.amount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
        toast.error(`Line ${i + 1} needs a valid amount (₹0 or more).`);
        return;
      }
      cleaned.push({ description: d.description.trim(), amount });
    }
    if (cleaned.length === 0) {
      toast.error("Add at least one line item.");
      return;
    }

    const payload = {
      clientEmail: email,
      number: trimmedNumber,
      date: date.trim(),
      dueDate: dueDate.trim(),
      status,
      items: cleaned,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        // clientEmail is immutable per the rules; only send the mutable fields.
        await updateDoc(doc(db, COLLECTIONS.projectInvoices, editingId), {
          number: payload.number,
          date: payload.date,
          dueDate: payload.dueDate,
          status: payload.status,
          items: payload.items,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(projectInvoicesCollection, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      const auditOk = await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: editingId ? "project_invoice.update" : "project_invoice.create",
        targetType: "projectInvoice",
        targetId: editingId ?? undefined,
        metadata: { clientEmail: email, number: trimmedNumber, status },
      });
      resetForm();
      setDialogOpen(false);
      if (auditOk) {
        toast.success(editingId ? "Invoice updated." : "Invoice issued.");
      } else {
        toast.warning(
          editingId
            ? "Invoice updated, but the audit log couldn't be recorded."
            : "Invoice issued, but the audit log couldn't be recorded.",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save the invoice. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(invoice: ProjectInvoice) {
    if (!admin) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.projectInvoices, invoice.id));
      const auditOk = await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "project_invoice.delete",
        targetType: "projectInvoice",
        targetId: invoice.id,
        metadata: { clientEmail: invoice.clientEmail, number: invoice.number },
      });
      if (auditOk) {
        toast.success("Invoice removed.");
      } else {
        toast.warning("Invoice removed, but the audit log couldn't be recorded.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't remove the invoice. Please try again.");
    }
  }

  const draftTotal = items.reduce((sum, d) => {
    const n = Number(d.amount);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);

  const addButton = canEdit ? (
    <div className="flex items-center gap-2">
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New invoice
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
        title="Invoices"
        description="Issue invoices to clients. They appear on the client's dashboard Invoices section, addressed by their account email."
        actions={addButton}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Invoices"
          value={invoices.loading ? "…" : total}
        />
        <StatCard
          icon={CheckCircle2}
          label="Paid"
          value={invoices.loading ? "…" : paidCount}
        />
        <StatCard
          icon={IndianRupee}
          label="Outstanding"
          value={invoices.loading ? "…" : formatCurrency(outstanding)}
        />
      </div>

      {invoices.loading ? (
        <p className="text-sm text-muted-foreground">Loading invoices…</p>
      ) : invoices.error ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t load invoices: {invoices.error}
        </p>
      ) : invoices.data.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Issue your first invoice to a client to show it on their dashboard."
          action={addButton}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.data.map((invoice) => (
                  <tr key={invoice.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-foreground">
                      {invoice.number}
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {invoice.items.length} item
                        {invoice.items.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {invoice.clientEmail}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatCurrency(invoiceTotal(invoice.items))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={invoice.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {invoice.date || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {invoice.dueDate || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEdit(invoice)}
                              aria-label={`Edit invoice ${invoice.number}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => void handleDelete(invoice)}
                              aria-label={`Delete invoice ${invoice.number}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
              {editingId ? "Edit invoice" : "New invoice"}
            </DialogTitle>
            <DialogDescription>
              The client signed in with this email sees the invoice on their
              dashboard&apos;s Invoices section.
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
                <label htmlFor="inv-client" className="text-sm font-medium text-foreground">
                  Client email
                </label>
                <input
                  id="inv-client"
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
                    The addressee can&apos;t be changed. Delete and re-issue to
                    move the invoice to a different client.
                  </p>
                )}
                <datalist id="admin-client-emails">
                  {clientEmailOptions.map((email) => (
                    <option key={email} value={email} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="inv-number" className="text-sm font-medium text-foreground">
                  Invoice number
                </label>
                <input
                  id="inv-number"
                  value={number}
                  onChange={(e) => {
                    markDirty();
                    setNumber(e.target.value);
                  }}
                  required
                  maxLength={99}
                  className={inputClasses}
                  placeholder="INV-2026-001"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="inv-date" className="text-sm font-medium text-foreground">
                  Issue date
                </label>
                <input
                  id="inv-date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    markDirty();
                    setDate(e.target.value);
                  }}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="inv-due" className="text-sm font-medium text-foreground">
                  Due date
                </label>
                <input
                  id="inv-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    markDirty();
                    setDueDate(e.target.value);
                  }}
                  className={inputClasses}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="inv-status" className="text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="inv-status"
                  value={status}
                  onChange={(e) => {
                    markDirty();
                    setStatus(e.target.value as InvoiceStatus);
                  }}
                  className={inputClasses}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  Line items
                </span>
                <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add item
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  No line items yet. Add at least one to issue the invoice.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((row, idx) => (
                    <div
                      key={row.id}
                      className="flex items-end gap-2 rounded-lg border border-border p-2"
                    >
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={`item-desc-${row.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Description
                        </label>
                        <input
                          id={`item-desc-${row.id}`}
                          value={row.description}
                          onChange={(e) =>
                            patchItem(row.id, { description: e.target.value })
                          }
                          className={inputClasses}
                          placeholder="Development - Milestone 1"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <label
                          htmlFor={`item-amt-${row.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Amount (₹)
                        </label>
                        <input
                          id={`item-amt-${row.id}`}
                          type="number"
                          min={0}
                          step="1"
                          value={row.amount}
                          onChange={(e) =>
                            patchItem(row.id, { amount: e.target.value })
                          }
                          className={inputClasses}
                          placeholder="5000"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItemRow(row.id)}
                        aria-label={`Remove line ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-right text-sm font-medium text-foreground">
                Total: {formatCurrency(draftTotal)}
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
                    : "Issue invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
