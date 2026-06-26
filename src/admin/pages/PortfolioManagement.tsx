import { useEffect, useState } from "react";
import {
  Images,
  FolderGit2,
  EyeOff,
  Eye,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
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
import { usePortfolio } from "../hooks/useAdminData";
import { writeAuditLog } from "../lib/audit";
import { COLLECTIONS, portfolioCollection } from "../lib/collections";
import { formatDate } from "../lib/format";
import {
  PORTFOLIO_CATEGORIES,
  type PortfolioCategory,
  type PortfolioItem,
} from "../types";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/app/components/UnsavedChangesDialog";

const inputClasses =
  "block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40";

/** Split a comma/newline-separated tech string into a clean list. */
function parseTechnologies(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        published
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground",
      )}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function CoverThumb({ item }: { item: PortfolioItem }) {
  if (!item.imageUrl) {
    return (
      <div className="flex h-12 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Images className="h-4 w-4" aria-hidden="true" />
      </div>
    );
  }
  return (
    <img
      src={item.imageUrl}
      alt=""
      className="h-12 w-16 rounded-md object-cover ring-1 ring-border"
      loading="lazy"
    />
  );
}

export function PortfolioManagement() {
  const { admin, can } = useAdmin();
  const portfolio = usePortfolio();
  const canEdit = can("projects:edit");
  const { markDirty, markClean, blocker } = useUnsavedChanges();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PortfolioCategory>("Business");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [techInput, setTechInput] = useState("");
  const [projectUrl, setProjectUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [order, setOrder] = useState("0");
  const [published, setPublished] = useState(true);

  const total = portfolio.data.length;
  const publishedCount = portfolio.data.filter((p) => p.published).length;
  const draftCount = total - publishedCount;

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("Business");
    setIndustry("");
    setDescription("");
    setImageUrl("");
    setTechInput("");
    setProjectUrl("");
    setGithubUrl("");
    setOrder("0");
    setPublished(true);
    markClean();
  }

  function openCreate() {
    resetForm();
    // Default the new item to the end of the current order.
    const nextOrder = portfolio.data.reduce((m, p) => Math.max(m, p.order), -1) + 1;
    setOrder(String(nextOrder));
    setDialogOpen(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setIndustry(item.industry);
    setDescription(item.description);
    setImageUrl(item.imageUrl);
    setTechInput(item.technologies.join(", "));
    setProjectUrl(item.projectUrl);
    setGithubUrl(item.githubUrl);
    setOrder(String(item.order));
    setPublished(item.published);
    setDialogOpen(true);
  }

  // "N" opens a fresh composer (skip when typing or a dialog is already open).
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
    // openCreate reads portfolio.data; depend on the data length so a fresh
    // composer always gets an up-to-date default order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, dialogOpen, portfolio.data]);

  async function handleSave() {
    if (!admin) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("A project title is required.");
      return;
    }
    const orderNum = Number(order);
    if (!Number.isFinite(orderNum)) {
      toast.error("Display order must be a number.");
      return;
    }

    const payload = {
      title: trimmedTitle,
      description: description.trim(),
      category,
      industry: industry.trim(),
      imageUrl: imageUrl.trim(),
      technologies: parseTechnologies(techInput),
      projectUrl: projectUrl.trim(),
      githubUrl: githubUrl.trim(),
      order: orderNum,
      published,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, COLLECTIONS.portfolio, editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(portfolioCollection, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: editingId ? "portfolio.update" : "portfolio.create",
        targetType: "portfolio",
        targetId: editingId ?? undefined,
        metadata: { title: trimmedTitle, published },
      });
      resetForm();
      setDialogOpen(false);
      toast.success(editingId ? "Project updated." : "Project added.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save the project. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePublish(item: PortfolioItem) {
    if (!admin) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.portfolio, item.id), {
        published: !item.published,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: item.published ? "portfolio.unpublish" : "portfolio.publish",
        targetType: "portfolio",
        targetId: item.id,
        metadata: { title: item.title },
      });
      toast.success(item.published ? "Project unpublished." : "Project published.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update visibility. Please try again.");
    }
  }

  async function handleMove(item: PortfolioItem, direction: "up" | "down") {
    if (!admin) return;
    const items = portfolio.data; // already sorted by display order
    const index = items.findIndex((p) => p.id === item.id);
    if (index === -1) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    // Reorder the visible array, then assign GAP-FREE sequential orders rather
    // than swapping raw values. Swapping fails silently when two items share an
    // order (e.g. legacy docs that default to 0); renumbering by position always
    // moves the item and self-heals any pre-existing ties.
    const reordered = [...items];
    [reordered[index], reordered[swapIndex]] = [
      reordered[swapIndex],
      reordered[index],
    ];

    try {
      const batch = writeBatch(db);
      reordered.forEach((p, i) => {
        if (p.order !== i) {
          batch.update(doc(db, COLLECTIONS.portfolio, p.id), {
            order: i,
            updatedAt: serverTimestamp(),
          });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't reorder. Please try again.");
    }
  }

  async function handleDelete(item: PortfolioItem) {
    if (!admin) return;
    try {
      await deleteDoc(doc(db, COLLECTIONS.portfolio, item.id));
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "portfolio.delete",
        targetType: "portfolio",
        targetId: item.id,
        metadata: { title: item.title },
      });
      toast.success("Project removed.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't remove the project. Please try again.");
    }
  }

  const addButton = canEdit ? (
    <div className="flex items-center gap-2">
      <Button onClick={openCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add project
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
        title="Portfolio"
        description="Manage the showcase projects that appear on the public marketing site. Only published projects are visible to visitors."
        actions={addButton}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FolderGit2}
          label="Projects"
          value={portfolio.loading ? "…" : total}
        />
        <StatCard
          icon={Images}
          label="Published"
          value={portfolio.loading ? "…" : publishedCount}
        />
        <StatCard
          icon={EyeOff}
          label="Drafts"
          value={portfolio.loading ? "…" : draftCount}
        />
      </div>

      {portfolio.loading ? (
        <p className="text-sm text-muted-foreground">Loading portfolio…</p>
      ) : portfolio.error ? (
        <p className="text-sm text-destructive">
          Couldn&apos;t load portfolio: {portfolio.error}
        </p>
      ) : portfolio.data.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No portfolio projects yet"
          description="Add your first showcase project to display it on the public site."
          action={addButton}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card text-card-foreground">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Cover</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Tech</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {portfolio.data.map((item, index) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3">
                      <CoverThumb item={item} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="mt-0.5 max-w-md truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.technologies.length}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge published={item.published} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.order}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(item.updatedAt ?? item.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void handleMove(item, "up")}
                              disabled={index === 0}
                              aria-label={`Move ${item.title} up`}
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void handleMove(item, "down")}
                              disabled={index === portfolio.data.length - 1}
                              aria-label={`Move ${item.title} down`}
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => void handleTogglePublish(item)}
                              aria-label={
                                item.published
                                  ? `Unpublish ${item.title}`
                                  : `Publish ${item.title}`
                              }
                              title={item.published ? "Unpublish" : "Publish"}
                            >
                              {item.published ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEdit(item)}
                              aria-label={`Edit ${item.title}`}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => void handleDelete(item)}
                              aria-label={`Delete ${item.title}`}
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
              {editingId ? "Edit project" : "Add project"}
            </DialogTitle>
            <DialogDescription>
              Published projects appear on the public marketing site&apos;s
              Portfolio section. Save as a draft to stage it first.
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
                <label htmlFor="pf-title" className="text-sm font-medium text-foreground">
                  Title
                </label>
                <input
                  id="pf-title"
                  value={title}
                  onChange={(e) => {
                    markDirty();
                    setTitle(e.target.value);
                  }}
                  required
                  maxLength={199}
                  className={inputClasses}
                  placeholder="VeritasAI"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pf-category" className="text-sm font-medium text-foreground">
                  Category
                </label>
                <select
                  id="pf-category"
                  value={category}
                  onChange={(e) => {
                    markDirty();
                    setCategory(e.target.value as PortfolioCategory);
                  }}
                  className={inputClasses}
                >
                  {PORTFOLIO_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pf-industry" className="text-sm font-medium text-foreground">
                Industry
              </label>
              <input
                id="pf-industry"
                value={industry}
                onChange={(e) => {
                  markDirty();
                  setIndustry(e.target.value);
                }}
                className={inputClasses}
                placeholder="AI & Cybersecurity"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pf-description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="pf-description"
                value={description}
                onChange={(e) => {
                  markDirty();
                  setDescription(e.target.value);
                }}
                rows={3}
                maxLength={4999}
                className={cn(inputClasses, "resize-y")}
                placeholder="What the project is and what you built."
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pf-image" className="text-sm font-medium text-foreground">
                Cover image URL
              </label>
              <input
                id="pf-image"
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  markDirty();
                  setImageUrl(e.target.value);
                }}
                className={inputClasses}
                placeholder="https://… or /portfolio/cover.png"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="pf-tech" className="text-sm font-medium text-foreground">
                Technologies
              </label>
              <input
                id="pf-tech"
                value={techInput}
                onChange={(e) => {
                  markDirty();
                  setTechInput(e.target.value);
                }}
                className={inputClasses}
                placeholder="React, Vite, FastAPI"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="pf-url" className="text-sm font-medium text-foreground">
                  Live demo URL
                </label>
                <input
                  id="pf-url"
                  type="url"
                  value={projectUrl}
                  onChange={(e) => {
                    markDirty();
                    setProjectUrl(e.target.value);
                  }}
                  className={inputClasses}
                  placeholder="https://example.web.app"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pf-github" className="text-sm font-medium text-foreground">
                  GitHub URL (optional)
                </label>
                <input
                  id="pf-github"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => {
                    markDirty();
                    setGithubUrl(e.target.value);
                  }}
                  className={inputClasses}
                  placeholder="https://github.com/org/repo"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="pf-order" className="text-sm font-medium text-foreground">
                  Display order
                </label>
                <input
                  id="pf-order"
                  type="number"
                  step="1"
                  value={order}
                  onChange={(e) => {
                    markDirty();
                    setOrder(e.target.value);
                  }}
                  className={inputClasses}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => {
                      markDirty();
                      setPublished(e.target.checked);
                    }}
                    className="h-4 w-4 rounded border-input"
                  />
                  Published (visible on the public site)
                </label>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || !title.trim()}>
                {submitting
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Add project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
