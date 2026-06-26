import { useEffect, useMemo, useState } from "react";
import { Megaphone, Plus, Trash2, Users } from "lucide-react";
import { addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
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
import { useClients, useProjectUpdates } from "../hooks/useAdminData";
import { writeAuditLog } from "../lib/audit";
import { COLLECTIONS, projectUpdatesCollection } from "../lib/collections";
import { formatDate } from "../lib/format";
import type { ProjectUpdate, UpdateType } from "../types";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/app/components/UnsavedChangesDialog";

const TYPE_OPTIONS: readonly UpdateType[] = [
  "milestone",
  "feature",
  "bugfix",
  "info",
];

const TYPE_LABELS: Record<UpdateType, string> = {
  milestone: "Milestone",
  feature: "Feature",
  bugfix: "Bug Fix",
  info: "Info",
};

const TYPE_PILL_CLASSES: Record<UpdateType, string> = {
  milestone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  feature: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  bugfix: "bg-red-500/10 text-red-600 dark:text-red-400",
  info: "bg-muted text-muted-foreground",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClasses =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40";

function TypePill({ type }: { type: UpdateType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TYPE_PILL_CLASSES[type],
      )}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

export function ProjectUpdates() {
  const { admin, can } = useAdmin();
  const updates = useProjectUpdates();
  const canEdit = can("projects:edit");
  const clients = useClients(canEdit);
  const { markDirty, markClean, blocker } = useUnsavedChanges();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<UpdateType>("milestone");

  // Known client emails power the composer's autocomplete datalist.
  const clientEmailOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const c of clients.data) {
      const email = c.email.trim().toLowerCase();
      if (email) seen.add(email);
    }
    return [...seen].sort();
  }, [clients.data]);

  // "N" opens the composer (skip when typing in a field).
  useEffect(() => {
    if (!canEdit) return;
    function handleKey(e: KeyboardEvent) {
      if (isTyping(e)) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setDialogOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [canEdit]);

  function resetForm() {
    setClientEmail("");
    setTitle("");
    setDescription("");
    setType("milestone");
    markClean();
  }

  async function handlePost() {
    if (!admin) return;
    const email = clientEmail.trim().toLowerCase();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!EMAIL_RE.test(email)) {
      toast.error("Enter a valid client email.");
      return;
    }
    if (!trimmedTitle || !trimmedDescription) {
      toast.error("Title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(projectUpdatesCollection, {
        clientEmail: email,
        title: trimmedTitle,
        description: trimmedDescription,
        type,
        createdAt: serverTimestamp(),
      });
      const auditOk = await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "project_update.create",
        targetType: "projectUpdate",
        metadata: { clientEmail: email, title: trimmedTitle, type },
      });
      resetForm();
      setDialogOpen(false);
      if (auditOk) {
        toast.success("Update posted to the client.");
      } else {
        toast.warning("Update posted, but the audit log couldn't be recorded.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't post the update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(update: ProjectUpdate) {
    if (!admin) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.projectUpdates, update.id));
      const auditOk = await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "project_update.delete",
        targetType: "projectUpdate",
        targetId: update.id,
        metadata: { clientEmail: update.clientEmail, title: update.title },
      });
      if (auditOk) {
        toast.success("Update removed.");
      } else {
        toast.warning("Update removed, but the audit log couldn't be recorded.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Couldn't remove the update. Please try again.");
    }
  }

  const total = updates.data.length;
  const clientsReached = useMemo(
    () => new Set(updates.data.map((u) => u.clientEmail)).size,
    [updates.data],
  );

  const postButton = canEdit ? (
    <div className="flex items-center gap-2">
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Post update
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
        title="Client Updates"
        description="Post progress updates that appear on the client's dashboard, addressed by their account email."
        actions={postButton}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={Megaphone}
          label="Total updates"
          value={updates.loading ? "…" : total}
        />
        <StatCard
          icon={Users}
          label="Clients reached"
          value={updates.loading ? "…" : clientsReached}
        />
      </div>

      {updates.loading ? (
        <p className="text-sm text-muted-foreground">Loading updates…</p>
      ) : updates.error ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t load updates: {updates.error}
        </p>
      ) : updates.data.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No updates posted yet"
          description="Post your first update to keep a client informed about their project."
          action={postButton}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Update</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Posted</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {updates.data.map((update) => (
                  <tr key={update.id} className="align-top">
                    <td className="px-4 py-3 text-muted-foreground">
                      {update.clientEmail}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {update.title}
                      </p>
                      <p className="mt-0.5 max-w-md whitespace-pre-line text-xs text-muted-foreground">
                        {update.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <TypePill type={update.type} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(update.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => void handleDelete(update)}
                            aria-label={`Delete update "${update.title}"`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Post an update</DialogTitle>
            <DialogDescription>
              The client signed in with this email will see it on their
              dashboard&apos;s Updates section.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handlePost();
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="update-client"
                className="text-sm font-medium text-foreground"
              >
                Client email
              </label>
              <input
                id="update-client"
                type="email"
                list="admin-client-emails"
                value={clientEmail}
                onChange={(e) => {
                  markDirty();
                  setClientEmail(e.target.value);
                }}
                required
                className={inputClasses}
                placeholder="client@example.com"
              />
              <datalist id="admin-client-emails">
                {clientEmailOptions.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="update-title"
                className="text-sm font-medium text-foreground"
              >
                Title
              </label>
              <input
                id="update-title"
                value={title}
                onChange={(e) => {
                  markDirty();
                  setTitle(e.target.value);
                }}
                required
                maxLength={199}
                className={inputClasses}
                placeholder="Homepage shipped"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="update-description"
                className="text-sm font-medium text-foreground"
              >
                Description
              </label>
              <textarea
                id="update-description"
                value={description}
                onChange={(e) => {
                  markDirty();
                  setDescription(e.target.value);
                }}
                required
                maxLength={4999}
                rows={4}
                className={cn(inputClasses, "resize-y")}
                placeholder="What changed, and what it means for the client."
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="update-type"
                className="text-sm font-medium text-foreground"
              >
                Type
              </label>
              <select
                id="update-type"
                value={type}
                onChange={(e) => {
                  markDirty();
                  setType(e.target.value as UpdateType);
                }}
                className={inputClasses}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {TYPE_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={submitting || !clientEmail.trim() || !title.trim()}
              >
                {submitting ? "Posting…" : "Post update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
