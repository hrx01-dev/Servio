import { useEffect, useState } from "react";
import {
  CollectionReference,
  DocumentData,
  limit as firestoreLimit,
  onSnapshot,
  query,
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
 * Subscribe to a whole collection in real time, parsing + sorting client-side.
 * Queries are limited to PAGE_SIZE (50) documents; callers surface a `loadMore`
 * function that raises the cap by another page when there may be more results.
 */
function useCollectionData<T>(
  ref: CollectionReference<DocumentData>,
  parse: (id: string, data: DocumentData) => T | null,
  compare?: (a: T, b: T) => number,
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

    const q = query(ref, firestoreLimit(pageLimit));
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
  }, [ref, parse, compare, mock, enabled, pageLimit]);

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
    DEV_MOCK_ENABLED ? MOCK_PROJECTS : undefined,
  );
}

export function useProjectUpdates(): CollectionState<ProjectUpdate> {
  // No dev-mock dataset — in local preview this simply shows an empty feed.
  return useCollectionData(
    projectUpdatesCollection,
    parseProjectUpdate,
    byCreatedDesc,
  );
}

export function useProjectBilling(): CollectionState<ProjectBilling> {
  // One billing document per client, sorted by email for easy scanning. No
  // dev-mock dataset — in local preview this simply shows an empty list.
  return useCollectionData(
    projectBillingCollection,
    parseProjectBilling,
    byClientEmail,
  );
}

export function useProjectInvoices(): CollectionState<ProjectInvoice> {
  // Newest first. No dev-mock dataset — local preview shows an empty list.
  return useCollectionData(
    projectInvoicesCollection,
    parseProjectInvoice,
    byCreatedDesc,
  );
}

export function usePortfolio(): CollectionState<PortfolioItem> {
  // Sorted by display order (then oldest-first) to match the public page. No
  // dev-mock dataset — in local preview this simply shows an empty list.
  return useCollectionData(portfolioCollection, parsePortfolioItem, byOrder);
}

export function useClients(enabled = true): CollectionState<Client> {
  return useCollectionData(
    clientsCollection,
    parseClient,
    byCreatedDesc,
    DEV_MOCK_ENABLED ? MOCK_CLIENTS : undefined,
    enabled,
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
