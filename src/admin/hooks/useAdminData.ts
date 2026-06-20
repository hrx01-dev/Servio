import { useEffect, useState } from "react";
import {
  CollectionReference,
  DocumentData,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  adminsCollection,
  auditLogsCollection,
  clientsCollection,
  messagesCollection,
  parseAdminProfile,
  parseAuditLog,
  parseClient,
  parseMessage,
  parseProject,
  projectsCollection,
} from "../lib/collections";
import {
  AdminProfile,
  AuditLogEntry,
  Client,
  ContactMessage,
  Project,
} from "../types";
import {
  DEV_MOCK_ENABLED,
  MOCK_ADMINS,
  MOCK_AUDIT,
  MOCK_CLIENTS,
  MOCK_MESSAGES,
  MOCK_PROJECTS,
} from "../lib/devMock";

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

function millis(value?: Timestamp): number {
  return value ? value.toMillis() : 0;
}

function byCreatedDesc(
  a: { createdAt?: Timestamp },
  b: { createdAt?: Timestamp },
): number {
  return millis(b.createdAt) - millis(a.createdAt);
}

/**
 * Subscribe to a whole collection in real time, parsing + sorting client-side.
 * Collections are small for the admin foundation, so this avoids composite
 * indexes and the orderBy "missing field" pitfall. `ref`/`parse`/`compare` are
 * stable module-level values, so the subscription is set up once.
 */
function useCollectionData<T>(
  ref: CollectionReference<DocumentData>,
  parse: (id: string, data: DocumentData) => T | null,
  compare?: (a: T, b: T) => number,
  mock?: T[],
): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Local preview: serve demo data instead of subscribing to Firestore.
    if (DEV_MOCK_ENABLED) {
      const data = mock ? [...mock] : [];
      if (compare) data.sort(compare);
      setState({ data, loading: false, error: null });
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data: T[] = [];
        snapshot.forEach((docSnap) => {
          const item = parse(docSnap.id, docSnap.data());
          if (item) data.push(item);
        });
        if (compare) data.sort(compare);
        setState({ data, loading: false, error: null });
      },
      (err) => setState({ data: [], loading: false, error: err.message }),
    );
    return unsubscribe;
  }, [ref, parse, compare, mock]);

  return state;
}

// The mock args are gated on DEV_MOCK_ENABLED (which folds to `false` in a
// production build) so the demo data + fake credentials are tree-shaken out of
// the prod bundle entirely.
export function useProjects(): CollectionState<Project> {
  return useCollectionData(
    projectsCollection,
    parseProject,
    byCreatedDesc,
    DEV_MOCK_ENABLED ? MOCK_PROJECTS : undefined,
  );
}

export function useClients(): CollectionState<Client> {
  return useCollectionData(
    clientsCollection,
    parseClient,
    byCreatedDesc,
    DEV_MOCK_ENABLED ? MOCK_CLIENTS : undefined,
  );
}

export function useMessages(): CollectionState<ContactMessage> {
  return useCollectionData(
    messagesCollection,
    parseMessage,
    byCreatedDesc,
    DEV_MOCK_ENABLED ? MOCK_MESSAGES : undefined,
  );
}

export function useAuditLogs(): CollectionState<AuditLogEntry> {
  return useCollectionData(
    auditLogsCollection,
    parseAuditLog,
    byCreatedDesc,
    DEV_MOCK_ENABLED ? MOCK_AUDIT : undefined,
  );
}

export function useAdmins(): CollectionState<AdminProfile> {
  return useCollectionData(
    adminsCollection,
    parseAdminProfile,
    undefined,
    DEV_MOCK_ENABLED ? MOCK_ADMINS : undefined,
  );
}
