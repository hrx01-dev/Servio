import { useEffect, useState } from "react";
import {
  CollectionReference,
  DocumentData,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
  QueryConstraint,
  Timestamp,
  where,
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
  parsePortfolioItem,
  parseProject,
  parseProjectBilling,
  parseProjectInvoice,
  parseProjectUpdate,
  portfolioCollection,
  projectBillingCollection,
  projectInvoicesCollection,
  projectsCollection,
  projectUpdatesCollection,
} from "../lib/collections";
import {
  AdminProfile,
  AuditLogEntry,
  Client,
  ContactMessage,
  MessageStatus,
  PortfolioItem,
  Project,
  ProjectBilling,
  ProjectInvoice,
  ProjectUpdate,
} from "../types";
import {
  DEV_MOCK_ENABLED,
  MOCK_ADMINS,
  MOCK_AUDIT,
  MOCK_CLIENTS,
  MOCK_MESSAGES,
  MOCK_PROJECTS,
} from "../lib/devMock";

const PAGE_SIZE = 50;

// Module-level constants so the array references are stable across renders,
// preventing the useCollectionData effect from re-firing on every render.
const ORDER_CREATED_DESC: QueryConstraint[] = [orderBy("createdAt", "desc")];
const ORDER_CLIENT_EMAIL_ASC: QueryConstraint[] = [orderBy("clientEmail", "asc")];
const ORDER_DISPLAY_ORDER: QueryConstraint[] = [
  orderBy("order", "asc"),
  orderBy("createdAt", "asc"),
];

export interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
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

function byClientEmail(
  a: { clientEmail: string },
  b: { clientEmail: string },
): number {
  return a.clientEmail.localeCompare(b.clientEmail);
}

function byOrder(
  a: { order: number; createdAt?: Timestamp },
  b: { order: number; createdAt?: Timestamp },
): number {
  if (a.order !== b.order) return a.order - b.order;
  return millis(a.createdAt) - millis(b.createdAt);
}

/**
 * Subscribe to a Firestore collection in real time, parsing + sorting.
 * serverOrder is applied before the limit so Firestore returns the correct
 * page window; the client-side compare handles any remaining tie-breaking.
 */
function useCollectionData<T>(
  ref: CollectionReference<DocumentData>,
  parse: (id: string, data: DocumentData) => T | null,
  compare?: (a: T, b: T) => number,
  serverOrder?: QueryConstraint[],
  mock?: T[],
  enabled = true,
): CollectionState<T> {
  const [pageLimit, setPageLimit] = useState(PAGE_SIZE);
  const [state, setState] = useState<{
    data: T[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
  }>({
    data: [],
    loading: true,
    error: null,
    hasMore: false,
  });

  useEffect(() => {
    if (!enabled) {
      setState({ data: [], loading: false, error: null, hasMore: false });
      return;
    }
    // Local preview: serve demo data instead of subscribing to Firestore.
    if (DEV_MOCK_ENABLED) {
      const data = mock ? [...mock] : [];
      if (compare) data.sort(compare);
      setState({ data, loading: false, error: null, hasMore: false });
      return;
    }

    const q = query(ref, ...(serverOrder ?? []), firestoreLimit(pageLimit));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: T[] = [];
        snapshot.forEach((docSnap) => {
          const item = parse(docSnap.id, docSnap.data());
          if (item) data.push(item);
        });
        if (compare) data.sort(compare);
        setState({ data, loading: false, error: null, hasMore: snapshot.size >= pageLimit });
      },
      (err) => setState({ data: [], loading: false, error: err.message, hasMore: false }),
    );
    return unsubscribe;
  }, [ref, parse, compare, serverOrder, mock, enabled, pageLimit]);

  return { ...state, loadMore: () => setPageLimit((p) => p + PAGE_SIZE) };
}

// The mock args are gated on DEV_MOCK_ENABLED (which folds to `false` in a
// production build) so the demo data + fake credentials are tree-shaken out of
// the prod bundle entirely.
export function useProjects(): CollectionState<Project> {
  return useCollectionData(
    projectsCollection,
    parseProject,
    byCreatedDesc,
    ORDER_CREATED_DESC,
    DEV_MOCK_ENABLED ? MOCK_PROJECTS : undefined,
  );
}

export function useProjectUpdates(): CollectionState<ProjectUpdate> {
  return useCollectionData(
    projectUpdatesCollection,
    parseProjectUpdate,
    byCreatedDesc,
    ORDER_CREATED_DESC,
  );
}

export function useProjectBilling(): CollectionState<ProjectBilling> {
  return useCollectionData(
    projectBillingCollection,
    parseProjectBilling,
    byClientEmail,
    ORDER_CLIENT_EMAIL_ASC,
  );
}

export function useProjectInvoices(): CollectionState<ProjectInvoice> {
  return useCollectionData(
    projectInvoicesCollection,
    parseProjectInvoice,
    byCreatedDesc,
    ORDER_CREATED_DESC,
  );
}

export function usePortfolio(): CollectionState<PortfolioItem> {
  return useCollectionData(
    portfolioCollection,
    parsePortfolioItem,
    byOrder,
    ORDER_DISPLAY_ORDER,
  );
}

export function useClients(enabled = true): CollectionState<Client> {
  return useCollectionData(
    clientsCollection,
    parseClient,
    byCreatedDesc,
    ORDER_CREATED_DESC,
    DEV_MOCK_ENABLED ? MOCK_CLIENTS : undefined,
    enabled,
  );
}

export function useMessages(status?: MessageStatus): CollectionState<ContactMessage> {
  const [pageLimit, setPageLimit] = useState(PAGE_SIZE);
  const [state, setState] = useState<{
    data: ContactMessage[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
  }>({ data: [], loading: true, error: null, hasMore: false });

  // Reset to the first page whenever the status filter changes.
  useEffect(() => {
    setPageLimit(PAGE_SIZE);
  }, [status]);

  useEffect(() => {
    if (DEV_MOCK_ENABLED) {
      const data = status
        ? MOCK_MESSAGES.filter((m) => m.status === status)
        : [...MOCK_MESSAGES];
      data.sort(byCreatedDesc);
      setState({ data, loading: false, error: null, hasMore: false });
      return;
    }

    const constraints: QueryConstraint[] = [];
    if (status) constraints.push(where("status", "==", status));
    constraints.push(orderBy("createdAt", "desc"));
    constraints.push(firestoreLimit(pageLimit));

    const unsubscribe = onSnapshot(
      query(messagesCollection, ...constraints),
      (snapshot) => {
        const data: ContactMessage[] = [];
        snapshot.forEach((docSnap) => {
          const item = parseMessage(docSnap.id, docSnap.data());
          if (item) data.push(item);
        });
        setState({ data, loading: false, error: null, hasMore: snapshot.size >= pageLimit });
      },
      (err) => setState({ data: [], loading: false, error: err.message, hasMore: false }),
    );
    return unsubscribe;
  }, [status, pageLimit]);

  return { ...state, loadMore: () => setPageLimit((p) => p + PAGE_SIZE) };
}

export function useAuditLogs(): CollectionState<AuditLogEntry> {
  return useCollectionData(
    auditLogsCollection,
    parseAuditLog,
    byCreatedDesc,
    ORDER_CREATED_DESC,
    DEV_MOCK_ENABLED ? MOCK_AUDIT : undefined,
  );
}

export function useAdmins(): CollectionState<AdminProfile> {
  return useCollectionData(
    adminsCollection,
    parseAdminProfile,
    undefined,
    undefined,
    DEV_MOCK_ENABLED ? MOCK_ADMINS : undefined,
  );
}
