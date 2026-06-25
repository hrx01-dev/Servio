import { Timestamp } from "firebase/firestore";

/**
 * Domain types for the Servio admin portal.
 *
 * These mirror the Firestore collections documented in `docs/ADMIN.md`
 * (`admins`, `projects`, `clients`, `messages`, `audit_logs`). Optional fields
 * are written by the app over time and may be absent on older documents, so
 * always parse Firestore data through the helpers in `lib/collections.ts`.
 */

/** The four administrator roles defined for the initial RBAC system. */
export type AdminRole =
  | "super_admin"
  | "frontend_dev"
  | "backend_dev"
  | "qa_delivery";

/** A document in the `admins` collection, keyed by the Firebase Auth uid. */
export interface AdminProfile {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  /** When true the account exists but is denied access to the portal. */
  disabled: boolean;
  /** Hashed security PIN (PBKDF2). Absent until the admin sets one up. */
  pinHash?: string;
  pinSalt?: string;
  pinIterations?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

export type ProjectStatus =
  | "lead"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

/** A document in the `projects` collection. */
export interface Project {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  status: ProjectStatus;
  /** Firebase Auth uids of the admins assigned to this project. */
  assignedTo: string[];
  budget?: number;
  description?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** A document in the `clients` collection. */
export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type MessageStatus = "new" | "read" | "replied" | "archived";

/** A document in the `messages` collection (contact / quote submissions). */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  body: string;
  status: MessageStatus;
  createdAt?: Timestamp;
}

/** A document in the `audit_logs` collection. Append-only. */
export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorEmail: string;
  /** A stable action key, e.g. `project.delete` or `admin.role_change`. */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Timestamp;
}
