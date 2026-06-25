import { collection, Timestamp, type DocumentData } from "firebase/firestore";
import { db } from "@/Firebase/firebase";
import { isAdminRole } from "../rbac/roles";
import {
  AdminProfile,
  AuditLogEntry,
  Client,
  ContactMessage,
  MessageStatus,
  Project,
  ProjectStatus,
} from "../types";

/** Firestore collection names — single source of truth. */
export const COLLECTIONS = {
  admins: "admins",
  projects: "projects",
  clients: "clients",
  messages: "messages",
  auditLogs: "audit_logs",
} as const;

export const adminsCollection = collection(db, COLLECTIONS.admins);
export const projectsCollection = collection(db, COLLECTIONS.projects);
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
const MESSAGE_STATUSES: readonly MessageStatus[] = [
  "new",
  "read",
  "replied",
  "archived",
];

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
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
