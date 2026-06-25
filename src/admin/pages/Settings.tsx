import { useState } from "react";
import { Settings as SettingsIcon, ShieldCheck, UserPlus, Users } from "lucide-react";
import { deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { db } from "@/Firebase/firebase";
import { PageHeader } from "../components/PageHeader";
import { RoleBadge } from "../components/RoleBadge";
import { EmptyState } from "../components/EmptyState";
import { AddAdminDialog } from "../components/AddAdminDialog";
import { useAdmin } from "../context/useAdmin";
import { usePinGate } from "../context/usePinGate";
import { useSensitiveAction } from "../hooks/useSensitiveAction";
import { useAdmins } from "../hooks/useAdminData";
import { writeAuditLog } from "../lib/audit";
import { COLLECTIONS } from "../lib/collections";
import { ADMIN_ROLES, roleLabel } from "../rbac/roles";
import { AdminProfile, AdminRole } from "../types";

export function Settings() {
  const { admin, can } = useAdmin();
  const admins = useAdmins();
  const runSensitive = useSensitiveAction();
  const { reverify } = usePinGate();
  const [showAddAdmin, setShowAddAdmin] = useState(false);

  if (!admin) return null;

  const currentAdmin = admin;
  const hasPin = Boolean(currentAdmin.pinHash);

  // Never let the portal lose its last enabled super admin.
  const enabledSuperCount = admins.data.filter(
    (a) => a.role === "super_admin" && !a.disabled,
  ).length;

  async function handleRoleChange(row: AdminProfile, newRole: AdminRole) {
    if (newRole === row.role) return;
    if (row.role === "super_admin" && !row.disabled && enabledSuperCount <= 1) {
      toast.error("You can't change the role of the last enabled super admin.");
      return;
    }
    try {
      const ran = await runSensitive(async () => {
        await updateDoc(doc(db, COLLECTIONS.admins, row.uid), {
          role: newRole,
          updatedAt: serverTimestamp(),
        });
        await writeAuditLog({
          actorUid: currentAdmin.uid,
          actorEmail: currentAdmin.email,
          action: "admin.role_change",
          targetType: "admin",
          targetId: row.uid,
          metadata: { from: row.role, to: newRole },
        });
      });
      if (ran) toast.success(`Role updated to ${roleLabel(newRole)}.`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the role. Please try again.");
    }
  }

  async function handleToggleDisabled(row: AdminProfile) {
    if (row.role === "super_admin" && !row.disabled && enabledSuperCount <= 1) {
      toast.error("You can't disable the last enabled super admin.");
      return;
    }
    try {
      const ran = await runSensitive(async () => {
        await updateDoc(doc(db, COLLECTIONS.admins, row.uid), {
          disabled: !row.disabled,
          updatedAt: serverTimestamp(),
        });
        await writeAuditLog({
          actorUid: currentAdmin.uid,
          actorEmail: currentAdmin.email,
          action: row.disabled ? "admin.enable" : "admin.disable",
          targetType: "admin",
          targetId: row.uid,
        });
      });
      if (ran) toast.success(row.disabled ? "Admin enabled." : "Admin disabled.");
    } catch (err) {
      console.error(err);
      toast.error("Couldn't update the admin. Please try again.");
    }
  }

  async function handleRemoveAdmin(row: AdminProfile) {
    if (row.role === "super_admin" && !row.disabled && enabledSuperCount <= 1) {
      toast.error("You can't remove the last enabled super admin.");
      return;
    }
    try {
      const ran = await runSensitive(async () => {
        await deleteDoc(doc(db, COLLECTIONS.admins, row.uid));
        await writeAuditLog({
          actorUid: currentAdmin.uid,
          actorEmail: currentAdmin.email,
          action: "admin.remove",
          targetType: "admin",
          targetId: row.uid,
          metadata: { email: row.email, role: row.role },
        });
      });
      if (ran) toast.success(`Removed ${row.displayName} from admin access.`);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't remove the admin. Please try again.");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Security, admin access, and system configuration."
      />

      {/* 1) Security PIN */}
      <div className="rounded-xl border bg-card p-5 text-card-foreground">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-foreground">Security PIN</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {hasPin ? "A security PIN is set." : "No security PIN configured yet."}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Sensitive actions — like changing roles or disabling admins — require
          this PIN before they run.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => void reverify()}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {hasPin ? "Re-verify PIN" : "Set up PIN"}
        </Button>
      </div>

      {/* 2) Admin users */}
      {can("admins:manage") && (
        <div className="rounded-xl border bg-card p-5 text-card-foreground">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">
                Admin users
              </h2>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddAdmin(true)}
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Add admin
            </Button>
          </div>
          {admins.loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : admins.data.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No admins found"
              description="Admin accounts will appear here once they are provisioned."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 pr-3 font-medium">Role</th>
                    <th className="py-2 pr-3 font-medium">Status</th>
                    <th className="py-2 pr-3 font-medium">Change role</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {admins.data.map((row) => {
                    const isSelf = currentAdmin.uid === row.uid;
                    const isLastSuper =
                      row.role === "super_admin" &&
                      !row.disabled &&
                      enabledSuperCount <= 1;
                    const locked = isSelf || isLastSuper;
                    const lockReason = isSelf
                      ? "You can't change your own role or status."
                      : isLastSuper
                        ? "Can't modify the last enabled super admin."
                        : undefined;
                    return (
                      <tr key={row.uid}>
                        <td className="py-3 pr-3 font-medium text-foreground">
                          {row.displayName}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (you)
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {row.email}
                        </td>
                        <td className="py-3 pr-3">
                          <RoleBadge role={row.role} />
                        </td>
                        <td className="py-3 pr-3 text-muted-foreground">
                          {row.disabled ? "Disabled" : "Active"}
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            value={row.role}
                            disabled={locked}
                            title={lockReason}
                            onChange={(e) =>
                              void handleRoleChange(
                                row,
                                e.target.value as AdminRole,
                              )
                            }
                            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {ADMIN_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {roleLabel(r)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={row.disabled ? "outline" : "destructive"}
                              size="sm"
                              disabled={locked}
                              title={lockReason}
                              onClick={() => void handleToggleDisabled(row)}
                            >
                              {row.disabled ? "Enable" : "Disable"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={locked}
                              title={locked ? lockReason : "Remove admin access"}
                              onClick={() => void handleRemoveAdmin(row)}
                              className="text-destructive hover:text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddAdmin && (
        <AddAdminDialog
          currentAdmin={currentAdmin}
          onClose={() => setShowAddAdmin(false)}
        />
      )}

      {/* 3) System configuration */}
      {can("settings:view") && (
        <div className="rounded-xl border bg-card p-5 text-card-foreground">
          <div className="flex items-center gap-2">
            <SettingsIcon
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-foreground">
              System configuration
            </h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Feature flags, third-party integrations, and other portal-wide
            settings will be managed here.
          </p>
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            Coming soon
          </p>
        </div>
      )}
    </div>
  );
}
