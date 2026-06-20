import { useMemo, useState } from "react";
import {
  Archive,
  Check,
  MailOpen,
  MessageSquare,
  Reply,
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/Firebase/firebase";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { useAdmin } from "../context/useAdmin";
import { useMessages } from "../hooks/useAdminData";
import { writeAuditLog } from "../lib/audit";
import { COLLECTIONS } from "../lib/collections";
import { formatRelative } from "../lib/format";
import { ContactMessage, MessageStatus } from "../types";

type StatusFilter = "all" | MessageStatus;

const STATUS_FILTERS: readonly StatusFilter[] = [
  "all",
  "new",
  "read",
  "replied",
  "archived",
];

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
};

function statusBadgeVariant(
  status: MessageStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "new":
      return "default";
    case "replied":
      return "secondary";
    case "archived":
      return "outline";
    case "read":
    default:
      return "outline";
  }
}

export function Messages() {
  const { admin, can } = useAdmin();
  const { data: messages, loading } = useMessages();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const canReply = can("messages:reply");

  const counts = useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: messages.length,
      new: 0,
      read: 0,
      replied: 0,
      archived: 0,
    };
    for (const message of messages) {
      base[message.status] += 1;
    }
    return base;
  }, [messages]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? messages
        : messages.filter((m) => m.status === filter),
    [messages, filter],
  );

  async function setStatus(message: ContactMessage, status: MessageStatus) {
    if (!admin) return;
    if (message.status === status || pendingId) return;
    setPendingId(message.id);
    try {
      await updateDoc(doc(db, COLLECTIONS.messages, message.id), { status });
      await writeAuditLog({
        actorUid: admin.uid,
        actorEmail: admin.email,
        action: "message.status_change",
        targetType: "message",
        targetId: message.id,
        metadata: { status },
      });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the message. Please try again.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Messages"
        description="Inbound enquiries from the website."
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((value) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(value)}
          >
            {STATUS_LABELS[value]}
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 text-xs",
                filter === value
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {counts[value]}
            </span>
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading messages…</p>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages"
          description={
            filter === "all"
              ? "Contact and quote form submissions will appear here."
              : `No ${STATUS_LABELS[filter].toLowerCase()} messages right now.`
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((message) => {
            const expanded = expandedId === message.id;
            const preview =
              message.subject ?? message.body.split("\n")[0];
            return (
              <li
                key={message.id}
                className="rounded-xl border bg-card text-card-foreground"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : message.id)
                  }
                  className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {message.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {message.email}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-sm text-muted-foreground",
                        expanded ? "" : "truncate",
                      )}
                    >
                      {preview}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={statusBadgeVariant(message.status)}>
                      {STATUS_LABELS[message.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelative(message.createdAt)}
                    </span>
                  </div>
                </button>

                {expanded && (
                  <div className="space-y-4 border-t border-border px-5 py-4">
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {message.body}
                    </p>
                    {canReply && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === message.id}
                          onClick={() =>
                            void setStatus(message, "read")
                          }
                        >
                          <MailOpen className="h-4 w-4" aria-hidden="true" />
                          Mark read
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === message.id}
                          onClick={() =>
                            void setStatus(message, "replied")
                          }
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Mark replied
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === message.id}
                          onClick={() =>
                            void setStatus(message, "archived")
                          }
                        >
                          <Archive className="h-4 w-4" aria-hidden="true" />
                          Archive
                        </Button>
                        <Button variant="secondary" size="sm" asChild>
                          <a
                            href={`mailto:${message.email}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Reply className="h-4 w-4" aria-hidden="true" />
                            Reply
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
