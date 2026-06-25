import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { LogOut, ShieldCheck } from "lucide-react";
import { auth } from "@/Firebase/firebase";
import { cn } from "@/app/components/ui/utils";
import { ADMIN_NAV } from "../rbac/navigation";
import { useAdmin } from "../context/useAdmin";
import { usePinGate } from "../context/usePinGate";
import { RoleBadge } from "./RoleBadge";
import { initials } from "../lib/format";

export function AdminSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { admin, can } = useAdmin();
  const { clearPinSession } = usePinGate();
  const navigate = useNavigate();
  const items = ADMIN_NAV.filter((item) => can(item.permission));

  const handleSignOut = async () => {
    // Clear the session-level PIN flag before signing out so the next login
    // always requires a fresh PIN verification.
    clearPinSession();
    await signOut(auth);
    onNavigate?.();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "flex w-64 flex-col border-r border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">Servio Admin</p>
          <p className="text-xs text-muted-foreground">Control panel</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Admin navigation">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {admin && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
              {initials(admin.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {admin.displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {admin.email}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-2">
            <RoleBadge role={admin.role} />
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
