import {
  collection,
  onSnapshot,
  query,
  where,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import {
  normalizeEmail,
  parseClientInvoice,
  sortByNewest,
  type ClientInvoice,
} from "../lib/invoices";

/** Firestore collection holding admin-authored, client-addressed invoices. */
export const PROJECT_INVOICES_COLLECTION = "projectInvoices";

/**
 * Subscribe in real time to the invoices addressed to `email`. The query is a
 * single equality filter (no orderBy → no composite index, mirroring the admin
 * data layer) and we sort newest-first client-side. The security rules ensure a
 * client only ever receives documents matching their own verified token email.
 *
 * Returns the Firestore unsubscribe function.
 */
export function subscribeClientInvoices(
  email: string,
  onData: (invoices: ClientInvoice[]) => void,
  onError: (error: FirestoreError) => void,
): () => void {
  const q = query(
    collection(db, PROJECT_INVOICES_COLLECTION),
    where("clientEmail", "==", normalizeEmail(email)),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const invoices: ClientInvoice[] = [];
      snapshot.forEach((docSnap) => {
        const parsed = parseClientInvoice(docSnap.id, docSnap.data());
        if (parsed) invoices.push(parsed);
      });
      invoices.sort(sortByNewest);
      onData(invoices);
    },
    onError,
  );
}
