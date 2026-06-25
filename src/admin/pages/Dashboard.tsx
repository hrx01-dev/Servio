import { useState } from "react";
import {
  Check,
  FolderKanban,
  Lock,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";
import { RoleBadge } from "../components/RoleBadge";
import { EmptyState } from "../components/EmptyState";
import { useAdmin } from "../context/useAdmin";
import {
  useClients,
  useMessages,
  useProjects,
} from "../hooks/useAdminData";
import { useSensitiveAction } from "../hooks/useSensitiveAction";
import { permissionsForRole } from "../rbac/permissions";
import { roleLabel } from "../rbac/roles";
import { formatCurrency, formatRelative } from "../lib/format";

export function Dashboard() {
  const { admin, role, can } = useAdmin();
  const projects = useProjects();
  const clients = useClients();
  const messages = useMessages();
  const runSensitive = useSensitiveAction();
  const [revenueRevealed, setRevenueRevealed] = useState(false);

  if (!admin || !role) return null;

  const newMessages = messages.data.filter((m) => m.status === "new").length;
  const activeProjects = projects.data.filter(
    (p) => p.status === "active",
  ).length;
  const capabilities = permissionsForRole(role);
  const firstName = admin.displayName.split(" ")[0];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening across Servio."
        actions={<RoleBadge role={role} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {can("projects:view") && (
          <StatCard
            icon={FolderKanban}
            label="Projects"
            value={projects.loading ? "…" : projects.data.length}
            hint={`${activeProjects} active`}
          />
        )}
        {can("clients:view") && (
          <StatCard
            icon={Users}
            label="Clients"
            value={clients.loading ? "…" : clients.data.length}
          />
        )}
        {can("messages:view") && (
          <StatCard
            icon={MessageSquare}
            label="New messages"
            value={messages.loading ? "…" : newMessages}
            hint={`${messages.data.length} total`}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 text-card-foreground lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Your access</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You are signed in as a{" "}
            <span className="font-medium text-foreground">
              {roleLabel(role)}
            </span>
            . These are the capabilities granted to your role.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {capabilities.map((capability) => (
              <li
                key={capability}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check
                  className="h-4 w-4 shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
                <span className="font-mono text-xs">{capability}</span>
              </li>
            ))}
          </ul>
        </div>

        {can("business:view_sensitive") && (
          <div className="rounded-xl border bg-card p-5 text-card-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                Business metrics
              </h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Revenue this month
            </p>
            {revenueRevealed ? (
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {formatCurrency(2_480_000)}
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  void runSensitive(() => setRevenueRevealed(true))
                }
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Reveal (PIN required)
              </Button>
            )}
          </div>
        )}
      </div>

      {can("messages:view") && (
        <div className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Recent messages
          </h2>
          {messages.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : messages.data.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Contact and quote form submissions will appear here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {messages.data.slice(0, 5).map((message) => (
                <li
                  key={message.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {message.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {message.subject ?? message.body}
                    </p>
                  </div>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                    {formatRelative(message.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
