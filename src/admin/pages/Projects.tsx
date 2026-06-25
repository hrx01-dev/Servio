import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
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
import { useProjects } from "../hooks/useAdminData";
import { useSensitiveAction } from "../hooks/useSensitiveAction";
import { writeAuditLog } from "../lib/audit";
import { COLLECTIONS, projectsCollection } from "../lib/collections";
import { formatCurrency, formatDate } from "../lib/format";
import type { Project, ProjectStatus } from "../types";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/app/components/UnsavedChangesDialog";

const STATUS_OPTIONS: readonly ProjectStatus[] = [
  "lead",
  "active",
  "on_hold",
  "completed",
  "archived",
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  lead: "Lead",
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_PILL_CLASSES: Record<ProjectStatus, string> = {
  lead: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  on_hold: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-primary/10 text-primary",
  archived: "bg-muted text-muted-foreground",
};

const inputClasses =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40";

function StatusPill({ status }: { status: ProjectStatus }) {
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

export function Projects() {
  const { admin, can } = useAdmin();
  const projects = useProjects();
  const runSensitive = useSensitiveAction();
  const location = useLocation();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("lead");
  const [clientName, setClientName] = useState("");
  const [budget, setBudget] = useState("");

  const canEdit = can("projects:edit");
  const canDelete = can("projects:delete");
  const { markDirty, markClean, blocker } = useUnsavedChanges();

  // "N" shortcut — open New Project dialog (skip when typing in a form field)
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

  // Open dialog when the command palette navigates here with { state: { openNew: true } }
  useEffect(() => {
    if (location.state?.openNew && canEdit) {
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, canEdit, navigate, location.pathname]);

  function resetForm() {
    setName("");
    setStatus("lead");
    setClientName("");
    setBudget("");
    markClean();
  }

  async function handleCreate() {
    if (!admin) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSubmitting(true);
    try {
      const trimmedClient = clientName.trim();
      const parsedBudget = Number(budget);
      await addDoc(projectsCollection, {
        name: trimmedName,
        status,
        ...(trimmedClient ? { clientName: trimmedClient } : {}),
        ...(budget.trim() && Number.isFinite(parsedBudget)
          ? { budget: parsedBudget }
          : {}),
        assignedTo: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "project.create",
        targetType: "project",
        metadata: { name: trimmedName },
      });
      resetForm();
      setDialogOpen(false);
      toast.success("Project created.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't create the project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(project: Project, next: ProjectStatus) {
    if (!admin || next === project.status) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.projects, project.id), {
        status: next,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "project.status_change",
        targetType: "project",
        targetId: project.id,
        metadata: { status: next },
      });
      toast.success(`Status updated to ${STATUS_LABELS[next]}.`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the status. Please try again.");
    }
  }

  async function handleDelete(project: Project) {
    if (!admin) return;
    try {
      const ran = await runSensitive(async () => {
        await deleteDoc(doc(db, COLLECTIONS.projects, project.id));
        await writeAuditLog({
          actorUid: admin.uid,
          actorEmail: admin.email,
          action: "project.delete",
          targetType: "project",
          targetId: project.id,
          metadata: { name: project.name },
        });
      });
      if (ran) toast.success("Project deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't delete the project. Please try again.");
    }
  }

  const total = projects.data.length;
  const activeCount = projects.data.filter((p) => p.status === "active").length;
  const completedCount = projects.data.filter(
    (p) => p.status === "completed",
  ).length;

  const newProjectButton = canEdit ? (
    <div className="flex items-center gap-2">
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        New project
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
        title="Projects"
        description="Track delivery across every engagement."
        actions={newProjectButton}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={FolderKanban}
          label="Total projects"
          value={projects.loading ? "…" : total}
        />
        <StatCard
          icon={FolderKanban}
          label="Active"
          value={projects.loading ? "…" : activeCount}
        />
        <StatCard
          icon={FolderKanban}
          label="Completed"
          value={projects.loading ? "…" : completedCount}
        />
      </div>

      {projects.loading ? (
        <p className="text-sm text-muted-foreground">Loading projects…</p>
      ) : projects.data.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start tracking delivery."
          action={newProjectButton}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Budget</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.data.map((project) => (
                  <tr key={project.id}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {project.name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={project.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.clientName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.assignedTo.length}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCurrency(project.budget)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <select
                            value={project.status}
                            onChange={(e) =>
                              void handleStatusChange(
                                project,
                                e.target.value as ProjectStatus,
                              )
                            }
                            className="rounded-md border border-input bg-background px-2 py-1 text-xs outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
                            aria-label={`Change status for ${project.name}`}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {STATUS_LABELS[option]}
                              </option>
                            ))}
                          </select>
                        )}
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => void handleDelete(project)}
                            aria-label={`Delete ${project.name}`}
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
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Add a delivery project to track its progress.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleCreate();
            }}
          >
            <div className="space-y-1.5">
              <label
                htmlFor="project-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="project-name"
                value={name}
                onChange={(e) => { markDirty(); setName(e.target.value); }}
                required
                className={inputClasses}
                placeholder="Website redesign"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="project-status"
                className="text-sm font-medium text-foreground"
              >
                Status
              </label>
              <select
                id="project-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className={inputClasses}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="project-client"
                className="text-sm font-medium text-foreground"
              >
                Client{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id="project-client"
                value={clientName}
                onChange={(e) => { markDirty(); setClientName(e.target.value); }}
                className={inputClasses}
                placeholder="Acme Inc."
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="project-budget"
                className="text-sm font-medium text-foreground"
              >
                Budget{" "}
                <span className="text-xs text-muted-foreground">
                  (optional)
                </span>
              </label>
              <input
                id="project-budget"
                type="number"
                min="0"
                value={budget}
                onChange={(e) => { markDirty(); setBudget(e.target.value); }}
                className={inputClasses}
                placeholder="100000"
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || !name.trim()}>
                {submitting ? "Creating…" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
