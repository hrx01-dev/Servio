import { ClipboardList } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { useAuditLogs } from "../hooks/useAdminData";
import { formatRelative } from "../lib/format";

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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Action</th>
                  <th className="py-2 pr-3 font-medium">Actor</th>
                  <th className="py-2 pr-3 font-medium">Target</th>
                  <th className="py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.data.slice(0, 50).map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-3">
                      <span className="font-mono text-xs text-foreground">
                        {entry.action}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {entry.actorEmail || "—"}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {entry.targetType
                        ? `${entry.targetType}/${entry.targetId ?? "—"}`
                        : "—"}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {formatRelative(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
