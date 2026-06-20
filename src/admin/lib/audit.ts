import { addDoc, serverTimestamp } from "firebase/firestore";
import { auditLogsCollection } from "./collections";

export interface AuditInput {
  actorUid: string;
  actorEmail: string;
  /** Stable action key, e.g. `project.delete`, `admin.role_change`. */
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to the `audit_logs` collection. Audit logging is best-effort
 * and must never break the user-facing action that triggered it, so failures
 * are swallowed (and surfaced to the console) rather than thrown.
 */
export async function writeAuditLog(input: AuditInput): Promise<void> {
  try {
    await addDoc(auditLogsCollection, {
      actorUid: input.actorUid,
      actorEmail: input.actorEmail,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? {},
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[audit] failed to write log entry", input.action, err);
  }
}
