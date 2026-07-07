/**
 * permissions.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Regression tests for the RBAC permission matrix (issue #241).
 *
 * Covers:
 *   - Unauthenticated access: null / undefined role always denied
 *   - Admin-only routes: settings, admins:manage, business:view_sensitive,
 *     projects:delete are super_admin-exclusive
 *   - Privilege escalation: every non-super-admin role is rejected for every
 *     permission it should NOT hold
 *   - Complete permission sets: each role holds exactly the right grants
 *   - Sensitive permissions list is correct
 *
 * Run with: npx vitest run src/admin/rbac/permissions.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  ALL_PERMISSIONS,
  hasPermission,
  permissionsForRole,
  ROLE_PERMISSIONS,
  SENSITIVE_PERMISSIONS,
  type Permission,
} from "./permissions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Permissions that only super_admin should hold. */
const SUPER_ADMIN_ONLY: Permission[] = [
  "projects:delete",
  "settings:view",
  "admins:manage",
  "business:view_sensitive",
];

// ─── Unauthenticated access ───────────────────────────────────────────────────

describe("hasPermission — unauthenticated access", () => {
  it("returns false for a null role on every permission", () => {
    for (const p of ALL_PERMISSIONS) {
      expect(hasPermission(null, p), `null role should not have ${p}`).toBe(false);
    }
  });

  it("returns false for an undefined role on every permission", () => {
    for (const p of ALL_PERMISSIONS) {
      expect(hasPermission(undefined, p), `undefined role should not have ${p}`).toBe(false);
    }
  });
});

// ─── Admin-only routes ────────────────────────────────────────────────────────

describe("hasPermission — admin-only routes (super_admin exclusive)", () => {
  it.each(SUPER_ADMIN_ONLY)("only super_admin holds '%s'", (permission) => {
    expect(hasPermission("super_admin", permission)).toBe(true);
    expect(hasPermission("frontend_dev", permission)).toBe(false);
    expect(hasPermission("backend_dev", permission)).toBe(false);
    expect(hasPermission("qa_delivery", permission)).toBe(false);
  });
});

// ─── Privilege escalation — qa_delivery ──────────────────────────────────────

describe("hasPermission — privilege escalation: qa_delivery", () => {
  const BLOCKED: Permission[] = [
    "projects:edit",
    "projects:assign",
    "projects:delete",
    "clients:edit",
    "settings:view",
    "admins:manage",
    "audit:view",
    "business:view_sensitive",
  ];

  it.each(BLOCKED)("qa_delivery cannot '%s'", (permission) => {
    expect(hasPermission("qa_delivery", permission)).toBe(false);
  });

  it("qa_delivery can view dashboard, projects, clients, and messages", () => {
    expect(hasPermission("qa_delivery", "dashboard:view")).toBe(true);
    expect(hasPermission("qa_delivery", "projects:view")).toBe(true);
    expect(hasPermission("qa_delivery", "clients:view")).toBe(true);
    expect(hasPermission("qa_delivery", "messages:view")).toBe(true);
    expect(hasPermission("qa_delivery", "messages:reply")).toBe(true);
  });
});

// ─── Privilege escalation — frontend_dev ─────────────────────────────────────

describe("hasPermission — privilege escalation: frontend_dev", () => {
  const BLOCKED: Permission[] = [
    "projects:assign",
    "projects:delete",
    "clients:edit",
    "settings:view",
    "admins:manage",
    "audit:view",
    "business:view_sensitive",
  ];

  it.each(BLOCKED)("frontend_dev cannot '%s'", (permission) => {
    expect(hasPermission("frontend_dev", permission)).toBe(false);
  });

  it("frontend_dev can view and edit projects but not assign or delete", () => {
    expect(hasPermission("frontend_dev", "projects:view")).toBe(true);
    expect(hasPermission("frontend_dev", "projects:edit")).toBe(true);
    expect(hasPermission("frontend_dev", "projects:assign")).toBe(false);
    expect(hasPermission("frontend_dev", "projects:delete")).toBe(false);
  });
});

// ─── Privilege escalation — backend_dev ──────────────────────────────────────

describe("hasPermission — privilege escalation: backend_dev", () => {
  const BLOCKED: Permission[] = [
    "projects:delete",
    "settings:view",
    "admins:manage",
    "business:view_sensitive",
  ];

  it.each(BLOCKED)("backend_dev cannot '%s'", (permission) => {
    expect(hasPermission("backend_dev", permission)).toBe(false);
  });

  it("backend_dev can assign projects and edit clients (unlike qa_delivery)", () => {
    expect(hasPermission("backend_dev", "projects:assign")).toBe(true);
    expect(hasPermission("backend_dev", "clients:edit")).toBe(true);
    expect(hasPermission("backend_dev", "audit:view")).toBe(true);
  });
});

// ─── Complete permission sets ─────────────────────────────────────────────────

describe("permissionsForRole — complete permission sets", () => {
  it("super_admin holds every defined permission", () => {
    const granted = permissionsForRole("super_admin");
    for (const p of ALL_PERMISSIONS) {
      expect(granted, `super_admin is missing ${p}`).toContain(p);
    }
    expect(granted).toHaveLength(ALL_PERMISSIONS.length);
  });

  it("frontend_dev holds exactly the expected permissions", () => {
    const expected: Permission[] = [
      "dashboard:view",
      "projects:view",
      "projects:edit",
      "clients:view",
      "messages:view",
      "messages:reply",
    ];
    const granted = [...permissionsForRole("frontend_dev")].sort();
    expect(granted).toEqual([...expected].sort());
  });

  it("backend_dev holds exactly the expected permissions", () => {
    const expected: Permission[] = [
      "dashboard:view",
      "projects:view",
      "projects:edit",
      "projects:assign",
      "clients:view",
      "clients:edit",
      "messages:view",
      "messages:reply",
      "audit:view",
    ];
    const granted = [...permissionsForRole("backend_dev")].sort();
    expect(granted).toEqual([...expected].sort());
  });

  it("qa_delivery holds exactly the expected permissions", () => {
    const expected: Permission[] = [
      "dashboard:view",
      "projects:view",
      "clients:view",
      "messages:view",
      "messages:reply",
    ];
    const granted = [...permissionsForRole("qa_delivery")].sort();
    expect(granted).toEqual([...expected].sort());
  });
});

// ─── ROLE_PERMISSIONS completeness ───────────────────────────────────────────

describe("ROLE_PERMISSIONS", () => {
  it("defines an entry for every role", () => {
    const roles = ["super_admin", "frontend_dev", "backend_dev", "qa_delivery"] as const;
    for (const role of roles) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it("contains no unknown permission strings", () => {
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      for (const p of perms) {
        expect(
          (ALL_PERMISSIONS as readonly string[]).includes(p),
          `${role} has unknown permission: ${p}`,
        ).toBe(true);
      }
    }
  });
});

// ─── Sensitive (PIN-gated) permissions ───────────────────────────────────────

describe("SENSITIVE_PERMISSIONS — PIN-gated actions", () => {
  it("includes projects:delete, admins:manage, and business:view_sensitive", () => {
    expect(SENSITIVE_PERMISSIONS).toContain("projects:delete");
    expect(SENSITIVE_PERMISSIONS).toContain("admins:manage");
    expect(SENSITIVE_PERMISSIONS).toContain("business:view_sensitive");
  });

  it("no non-super-admin role holds any sensitive permission", () => {
    const limited = ["frontend_dev", "backend_dev", "qa_delivery"] as const;
    for (const role of limited) {
      for (const p of SENSITIVE_PERMISSIONS) {
        expect(
          hasPermission(role, p),
          `${role} should not hold sensitive permission ${p}`,
        ).toBe(false);
      }
    }
  });
});
