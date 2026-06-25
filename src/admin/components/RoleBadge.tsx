import { cn } from "@/app/components/ui/utils";
import { AdminRole } from "../types";
import { ROLE_META } from "../rbac/roles";

export function RoleBadge({
  role,
  className,
}: {
  role: AdminRole;
  className?: string;
}) {
  const meta = ROLE_META[role];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        meta.badgeClass,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
