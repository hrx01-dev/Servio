import { AdminRole } from "../types";

/** Display order for role pickers and tables. */
export const ADMIN_ROLES: readonly AdminRole[] = [
  "super_admin",
  "frontend_dev",
  "backend_dev",
  "qa_delivery",
];

export interface RoleMeta {
  label: string;
  description: string;
  /** Tailwind classes for a role badge (light + dark). */
  badgeClass: string;
}

export const ROLE_META: Record<AdminRole, RoleMeta> = {
  super_admin: {
    label: "Super Admin",
    description: "Full access to every part of the admin portal.",
    badgeClass:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  },
  frontend_dev: {
    label: "Frontend Dev",
    description: "Works on client-facing delivery; no settings or admin management.",
    badgeClass:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
  },
  backend_dev: {
    label: "Backend Dev",
    description: "Manages project delivery and assignments; cannot manage admins.",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  qa_delivery: {
    label: "QA / Delivery",
    description: "Reviews projects and clients; cannot modify project assignments.",
    badgeClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

export function roleLabel(role: AdminRole): string {
  return ROLE_META[role]?.label ?? role;
}

/** Runtime type guard used when parsing untrusted Firestore data. */
export function isAdminRole(value: unknown): value is AdminRole {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}
