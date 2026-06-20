import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../../context/useAdmin";
import { Permission } from "../../rbac/permissions";

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  /** Where to send users lacking the permission. */
  redirectTo?: string;
}

/**
 * Route-level capability gate. Wrap a page element to require a permission;
 * users without it are redirected (default: the unauthorized page).
 */
export function RequirePermission({
  permission,
  children,
  redirectTo = "/admin/unauthorized",
}: RequirePermissionProps) {
  const { can } = useAdmin();
  if (!can(permission)) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
