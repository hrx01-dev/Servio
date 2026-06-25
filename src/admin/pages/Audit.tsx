import { List, RowComponentProps } from "react-window";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { useAuditLogs } from "../hooks/useAdminData";
import { formatRelative } from "../lib/format";
import type { AuditLogEntry } from "../types";

const ROW_H = 44;
const LIST_H = 440;

interface AuditRowProps {
  entries: AuditLogEntry[];
}

function AuditRow({ index, style, entries }: RowComponentProps<AuditRowProps>) {
  const entry = entries[index];
  return (
    <div
      style={style}
      className="grid grid-cols-4 items-center gap-3 border-b border-border pr-1"
    >
      <span className="truncate font-mono text-xs text-foreground">
        {entry.action}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {entry.actorEmail || "—"}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {entry.targetType
          ? `${entry.targetType}/${entry.targetId ?? "—"}`
          : "—"}
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {formatRelative(entry.createdAt)}
      </span>
    </div>
  );
}

export function Audit() {
  const auditLogs = useAuditLogs();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit log"
        description="An append-only record of sensitive admin actions."
      />

      <div className="rounded-xl border bg-card p-5 text-card-foreground">
        {auditLogs.loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : auditLogs.data.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No audit entries yet"
            description="Sensitive admin actions will be recorded here."
          />
        ) : (
          <div>
            <div className="grid grid-cols-4 gap-3 border-b border-border pb-2 text-xs font-medium text-muted-foreground">
              <span>Action</span>
              <span>Actor</span>
              <span>Target</span>
              <span>When</span>
            </div>
            <div style={{ height: Math.min(LIST_H, auditLogs.data.length * ROW_H) }}>
              <List
                rowCount={auditLogs.data.length}
                rowHeight={ROW_H}
                rowProps={{ entries: auditLogs.data }}
                rowComponent={AuditRow}
                overscanCount={5}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
