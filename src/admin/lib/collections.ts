import { collection, Timestamp, type DocumentData } from "firebase/firestore";
import { db } from "@/Firebase/firebase";
import { isAdminRole } from "../rbac/roles";
import {
  AdminProfile,
  AuditLogEntry,
  Client,
  ContactMessage,
  InvoiceLineItem,
  InvoiceStatus,
  MessageStatus,
  PaymentStatus,
  PortfolioCategory,
  PortfolioItem,
  PORTFOLIO_CATEGORIES,
  Project,
  ProjectBilling,
  ProjectInvoice,
  ProjectPayment,
  ProjectStatus,
  ProjectUpdate,
  UpdateType,
} from "../types";

/** Firestore collection names — single source of truth. */
export const COLLECTIONS = {
  admins: "admins",
  projects: "projects",
  projectUpdates: "projectUpdates",
  projectBilling: "projectBilling",
  projectInvoices: "projectInvoices",
  portfolio: "portfolio",
  clients: "clients",
  messages: "messages",
  auditLogs: "audit_logs",
} as const;

export const adminsCollection = collection(db, COLLECTIONS.admins);
export const projectsCollection = collection(db, COLLECTIONS.projects);
export const projectUpdatesCollection = collection(
  db,
  COLLECTIONS.projectUpdates,
);
export const projectBillingCollection = collection(
  db,
  COLLECTIONS.projectBilling,
);
export const projectInvoicesCollection = collection(
  db,
  COLLECTIONS.projectInvoices,
);
export const portfolioCollection = collection(db, COLLECTIONS.portfolio);
export const clientsCollection = collection(db, COLLECTIONS.clients);
export const messagesCollection = collection(db, COLLECTIONS.messages);
export const auditLogsCollection = collection(db, COLLECTIONS.auditLogs);

const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "lead",
  "active",
  "on_hold",
  "completed",
  "archived",
];
const UPDATE_TYPES: readonly UpdateType[] = [
  "feature",
  "bugfix",
  "milestone",
  "info",
];
const MESSAGE_STATUSES: readonly MessageStatus[] = [
  "new",
  "read",
  "replied",
  "archived",
];
const PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "completed",
  "pending",
  "failed",
];
const INVOICE_STATUSES: readonly InvoiceStatus[] = ["paid", "unpaid", "overdue"];

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function optionalStr(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function ts(value: unknown): Timestamp | undefined {
  return value instanceof Timestamp ? value : undefined;
}

/**
 * Parse an `admins` document. Returns null when the role is missing or invalid
 * — such a document is treated as "not a valid admin" by the access guards.
 */
export function parseAdminProfile(
  uid: string,
  data: DocumentData,
): AdminProfile | null {
  if (!isAdminRole(data.role)) return null;
  const email = str(data.email);
  return {
    uid,
    email,
    displayName: str(data.displayName, email || "Admin"),
    role: data.role,
    disabled: data.disabled === true,
    pinHash: optionalStr(data.pinHash),
    pinSalt: optionalStr(data.pinSalt),
    pinIterations:
      typeof data.pinIterations === "number" ? data.pinIterations : undefined,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
    lastLoginAt: ts(data.lastLoginAt),
  };
}

export function parseProject(id: string, data: DocumentData): Project {
  const status = PROJECT_STATUSES.includes(data.status as ProjectStatus)
    ? (data.status as ProjectStatus)
    : "lead";
  return {
    id,
    name: str(data.name, "Untitled project"),
    clientId: optionalStr(data.clientId),
    clientName: optionalStr(data.clientName),
    status,
    assignedTo: Array.isArray(data.assignedTo)
      ? data.assignedTo.filter((v): v is string => typeof v === "string")
      : [],
    budget: typeof data.budget === "number" ? data.budget : undefined,
    description: optionalStr(data.description),
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

export function parseProjectUpdate(
  id: string,
  data: DocumentData,
): ProjectUpdate {
  const type = UPDATE_TYPES.includes(data.type as UpdateType)
    ? (data.type as UpdateType)
    : "info";
  return {
    id,
    clientEmail: str(data.clientEmail),
    title: str(data.title, "Untitled update"),
    description: str(data.description),
    type,
    createdAt: ts(data.createdAt),
  };
}

function parseProjectPayment(
  raw: unknown,
  index: number,
): ProjectPayment | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as DocumentData;
  if (typeof data.amount !== "number" || !Number.isFinite(data.amount)) {
    return null;
  }
  const status = PAYMENT_STATUSES.includes(data.status as PaymentStatus)
    ? (data.status as PaymentStatus)
    : "pending";
  return {
    id: typeof data.id === "string" && data.id ? data.id : `payment-${index}`,
    date: str(data.date),
    amount: data.amount,
    method: str(data.method),
    reference: str(data.reference),
    status,
  };
}

export function parseProjectBilling(
  id: string,
  data: DocumentData,
): ProjectBilling {
  const payments = Array.isArray(data.payments)
    ? data.payments
        .map((p, i) => parseProjectPayment(p, i))
        .filter((p): p is ProjectPayment => p !== null)
    : [];
  return {
    id,
    clientEmail: str(data.clientEmail),
    totalCost: num(data.totalCost),
    payments,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

function parseInvoiceLineItem(raw: unknown): InvoiceLineItem | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as DocumentData;
  if (typeof data.amount !== "number" || !Number.isFinite(data.amount)) {
    return null;
  }
  return { description: str(data.description), amount: data.amount };
}

export function parseProjectInvoice(
  id: string,
  data: DocumentData,
): ProjectInvoice {
  const status = INVOICE_STATUSES.includes(data.status as InvoiceStatus)
    ? (data.status as InvoiceStatus)
    : "unpaid";
  const items = Array.isArray(data.items)
    ? data.items
        .map(parseInvoiceLineItem)
        .filter((i): i is InvoiceLineItem => i !== null)
    : [];
  return {
    id,
    clientEmail: str(data.clientEmail),
    number: str(data.number),
    date: str(data.date),
    dueDate: str(data.dueDate),
    status,
    items,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

export function parsePortfolioItem(
  id: string,
  data: DocumentData,
): PortfolioItem {
  const category = PORTFOLIO_CATEGORIES.includes(data.category as PortfolioCategory)
    ? (data.category as PortfolioCategory)
    : "Other";
  const technologies = Array.isArray(data.technologies)
    ? data.technologies.filter((t): t is string => typeof t === "string")
    : [];
  return {
    id,
    title: str(data.title, "Untitled project"),
    description: str(data.description),
    category,
    industry: str(data.industry),
    imageUrl: str(data.imageUrl),
    technologies,
    projectUrl: str(data.projectUrl),
    githubUrl: str(data.githubUrl),
    order: num(data.order),
    published: data.published === true,
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

export function parseClient(id: string, data: DocumentData): Client {
  return {
    id,
    name: str(data.name, "Unnamed client"),
    company: optionalStr(data.company),
    email: str(data.email),
    phone: optionalStr(data.phone),
    notes: optionalStr(data.notes),
    createdAt: ts(data.createdAt),
    updatedAt: ts(data.updatedAt),
  };
}

export function parseMessage(id: string, data: DocumentData): ContactMessage {
  const status = MESSAGE_STATUSES.includes(data.status as MessageStatus)
    ? (data.status as MessageStatus)
    : "new";
  return {
    id,
    name: str(data.name, "Anonymous"),
    email: str(data.email),
    subject: optionalStr(data.subject),
    body: str(data.body),
    status,
    createdAt: ts(data.createdAt),
  };
}

export function parseAuditLog(id: string, data: DocumentData): AuditLogEntry {
  return {
    id,
    actorUid: str(data.actorUid),
    actorEmail: str(data.actorEmail),
    action: str(data.action, "unknown"),
    targetType: optionalStr(data.targetType),
    targetId: optionalStr(data.targetId),
    metadata:
      data.metadata && typeof data.metadata === "object"
        ? (data.metadata as Record<string, unknown>)
        : undefined,
    createdAt: ts(data.createdAt),
  };
}
