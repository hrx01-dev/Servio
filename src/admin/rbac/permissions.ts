import { AdminRole } from "../types";

/**
 * Fine-grained capabilities, in `resource:action` form. Routes and UI controls
 * are gated on these rather than on roles directly, so the role → capability
 * mapping can change without touching every call site.
 *
 * The authoritative copy of this matrix lives here AND is mirrored in
 * `firestore.rules`. Client checks are for UX; the rules are what actually
 * enforce access on the server. Keep the two in sync.
 */
export type Permission =
  | "dashboard:view"
  | "projects:view"
  | "projects:edit"
  | "projects:assign"
  | "projects:delete"
  | "clients:view"
  | "clients:edit"
  | "messages:view"
  | "messages:reply"
  | "settings:view"
  | "admins:manage"
  | "audit:view"
  | "business:view_sensitive";

export const ALL_PERMISSIONS: readonly Permission[] = [
  "dashboard:view",
  "projects:view",
  "projects:edit",
  "projects:assign",
  "projects:delete",
  "clients:view",
  "clients:edit",
  "messages:view",
  "messages:reply",
  "settings:view",
  "admins:manage",
  "audit:view",
  "business:view_sensitive",
];

/**
 * Role → permission matrix.
 *
 *  - super_admin  → full access.
 *  - frontend_dev → cannot reach settings or manage admins.
 *  - backend_dev  → cannot manage admins; may assign/edit projects.
 *  - qa_delivery  → read-mostly; cannot modify project assignments.
 */
export const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  frontend_dev: [
    "dashboard:view",
    "projects:view",
    "projects:edit",
    "clients:view",
    "messages:view",
    "messages:reply",
  ],
  backend_dev: [
    "dashboard:view",
    "projects:view",
    "projects:edit",
    "projects:assign",
    "clients:view",
    "clients:edit",
    "messages:view",
    "messages:reply",
    "audit:view",
  ],
  qa_delivery: [
    "dashboard:view",
    "projects:view",
    "clients:view",
    "messages:view",
    "messages:reply",
  ],
};

/**
 * Capabilities whose *actions* are wrapped in a security-PIN challenge at the
 * call site (via `useSensitiveAction`), regardless of the actor's role. This
 * is documentation of intent — viewing a route is never PIN-gated, only the
 * mutating/reveal action is. Keep it in sync with the runSensitive() call sites.
 */
export const SENSITIVE_PERMISSIONS: readonly Permission[] = [
  "projects:delete",
  "admins:manage",
  "business:view_sensitive",
];

export function permissionsForRole(role: AdminRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  role: AdminRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
