import { useState } from "react";
import { Building2, Mail, Pencil, Phone, Plus, Users } from "lucide-react";
import {
  addDoc,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { db } from "@/Firebase/firebase";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { useAdmin } from "../context/useAdmin";
import { useClients } from "../hooks/useAdminData";
import { COLLECTIONS, clientsCollection } from "../lib/collections";
import { writeAuditLog } from "../lib/audit";
import { formatRelative, initials } from "../lib/format";
import { Client } from "../types";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/app/components/UnsavedChangesDialog";

const INPUT_CLASS =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40";

interface ClientForm {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY_FORM: ClientForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  notes: "",
};

function toForm(client: Client): ClientForm {
  return {
    name: client.name,
    company: client.company ?? "",
    email: client.email,
    phone: client.phone ?? "",
    notes: client.notes ?? "",
  };
}

export function Clients() {
  const { admin, can } = useAdmin();
  const clients = useClients();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canEdit = can("clients:edit");
  const { markDirty, markClean, blocker } = useUnsavedChanges();

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    markClean();
    setDialogOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm(toForm(client));
    markClean();
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!admin) return;
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name || !email) return;

    const company = form.company.trim();
    const phone = form.phone.trim();
    const notes = form.notes.trim();

    setSaving(true);
    try {
      const fields = {
        name,
        company: company || null,
        email,
        phone: phone || null,
        notes: notes || null,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, COLLECTIONS.clients, editing.id), fields);
        await writeAuditLog({
          actorUid: admin.uid,
          actorEmail: admin.email,
          action: "client.update",
          targetType: "client",
          targetId: editing.id,
          metadata: { name },
        });
      } else {
        await addDoc(clientsCollection, {
          ...fields,
          createdAt: serverTimestamp(),
        });
        await writeAuditLog({
          actorUid: admin.uid,
          actorEmail: admin.email,
          action: "client.create",
          targetType: "client",
          metadata: { name },
        });
      }
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      markClean();
      toast.success(editing ? "Client updated." : "Client created.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save the client. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <UnsavedChangesDialog blocker={blocker} />
      <PageHeader
        title="Clients"
        description="Companies and contacts you work with."
        actions={
          canEdit ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              New client
            </Button>
          ) : undefined
        }
      />

      {clients.loading ? (
        <p className="text-sm text-muted-foreground">Loading clients…</p>
      ) : clients.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add the companies and contacts you work with to keep them in one place."
          action={
            canEdit ? (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New client
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.data.map((client) => (
            <div
              key={client.id}
              className="rounded-xl border bg-card p-5 text-card-foreground"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {initials(client.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {client.name}
                    </p>
                    {client.company && (
                      <p className="truncate text-xs text-muted-foreground">
                        {client.company}
                      </p>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${client.name}`}
                    onClick={() => openEdit(client)}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate text-foreground">
                    {client.email}
                  </span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate text-foreground">
                      {client.phone}
                    </span>
                  </div>
                )}
              </dl>

              <p className="mt-4 text-xs text-muted-foreground">
                Added {formatRelative(client.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) markClean();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit client" : "New client"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the details for this client."
                : "Add a new company or contact to your directory."}
            </DialogDescription>
          </DialogHeader>

          <form
            id="client-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="client-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="client-name"
                type="text"
                required
                value={form.name}
                onChange={(event) => {
                  markDirty();
                  setForm((prev) => ({ ...prev, name: event.target.value }));
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="client-company"
                className="text-sm font-medium text-foreground"
              >
                Company
              </label>
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="client-company"
                  type="text"
                  value={form.company}
                  onChange={(event) => {
                    markDirty();
                    setForm((prev) => ({
                      ...prev,
                      company: event.target.value,
                    }));
                  }}
                  className={`${INPUT_CLASS} pl-9`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="client-email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="client-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => {
                  markDirty();
                  setForm((prev) => ({ ...prev, email: event.target.value }));
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="client-phone"
                className="text-sm font-medium text-foreground"
              >
                Phone
              </label>
              <input
                id="client-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => {
                  markDirty();
                  setForm((prev) => ({ ...prev, phone: event.target.value }));
                }}
                className={INPUT_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="client-notes"
                className="text-sm font-medium text-foreground"
              >
                Notes
              </label>
              <textarea
                id="client-notes"
                rows={3}
                value={form.notes}
                onChange={(event) => {
                  markDirty();
                  setForm((prev) => ({ ...prev, notes: event.target.value }));
                }}
                className={INPUT_CLASS}
              />
            </div>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { markClean(); setDialogOpen(false); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="client-form"
              disabled={saving || !form.name.trim() || !form.email.trim()}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
