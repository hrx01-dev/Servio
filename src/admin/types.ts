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

/** The category of a client-facing project update. */
export type UpdateType = "feature" | "bugfix" | "milestone" | "info";

/**
 * A document in the `projectUpdates` collection — an update an admin posts for a
 * client, shown on the client dashboard. Addressed by the client's (lowercased)
 * email, the only identifier shared between the admin and the client's auth.
 */
export interface ProjectUpdate {
  id: string;
  clientEmail: string;
  title: string;
  description: string;
  type: UpdateType;
  createdAt?: Timestamp;
}

/** The state of a recorded payment. Only `completed` counts as money received. */
export type PaymentStatus = "completed" | "pending" | "failed";

/** A single recorded payment, embedded in a `projectBilling` document. */
export interface ProjectPayment {
  id: string;
  /** ISO calendar date ('YYYY-MM-DD') the payment was made. */
  date: string;
  amount: number;
  /** How the payment was made, e.g. "Bank Transfer", "UPI". */
  method: string;
  /** Transaction / reference id. */
  reference: string;
  status: PaymentStatus;
}

/**
 * A document in the `projectBilling` collection — a client's project billing,
 * authored by an admin and shown on the client dashboard's Payments section.
 * Addressed by the client's (lowercased) email, the only identifier shared
 * between the admin and the client's auth. The client derives amount-paid /
 * remaining from `payments`; only `totalCost` and `payments` are stored.
 */
export interface ProjectBilling {
  id: string;
  clientEmail: string;
  totalCost: number;
  payments: ProjectPayment[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** The settlement state of an invoice. */
export type InvoiceStatus = "paid" | "unpaid" | "overdue";

/** A single line item embedded in a `projectInvoices` document. */
export interface InvoiceLineItem {
  description: string;
  amount: number;
}

/**
 * A document in the `projectInvoices` collection — an invoice an admin issues to
 * a client, shown on the client dashboard's Invoices section. Addressed by the
 * client's (lowercased) email, the only identifier shared between the admin and
 * the client's auth. The client derives the total from `items`; only the items
 * are stored, never a separate total.
 */
export interface ProjectInvoice {
  id: string;
  clientEmail: string;
  number: string;
  /** ISO calendar date ('YYYY-MM-DD') the invoice was issued. */
  date: string;
  /** ISO calendar date ('YYYY-MM-DD') payment is due. */
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** The showcase category a portfolio project belongs to. */
export type PortfolioCategory = "Business" | "E-Commerce" | "SaaS" | "Other";

export const PORTFOLIO_CATEGORIES: readonly PortfolioCategory[] = [
  "Business",
  "E-Commerce",
  "SaaS",
  "Other",
];

/**
 * A document in the `portfolio` collection — a showcase project admins manage
 * from the dashboard and that renders on the public marketing site. Only
 * `published` items are exposed publicly; `order` controls their display order.
 * Optional fields (industry, projectUrl, githubUrl) are stored as empty strings
 * when unset so the security-rule shape can pin the full key set.
 */
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: PortfolioCategory;
  industry: string;
  /** Cover image URL. */
  imageUrl: string;
  technologies: string[];
  /** Live demo / project URL. */
  projectUrl: string;
  /** Optional source repository URL. */
  githubUrl: string;
  /** Display order on the public page (ascending). */
  order: number;
  /** When false the item is a draft, hidden from the public site. */
  published: boolean;
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
