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
  parseClientBilling,
  type ClientBilling,
} from "../lib/payments";

/** Firestore collection holding admin-authored, client-addressed billing. */
export const PROJECT_BILLING_COLLECTION = "projectBilling";

/**
 * Subscribe in real time to the billing document addressed to `email`. The query
 * is a single equality filter (no orderBy → no composite index, mirroring the
 * admin data layer); there is one billing document per client (the admin keys it
 * on the lowercased email), so we take the first match. The security rules ensure
 * a client only ever receives the document matching their own verified token
 * email.
 *
 * NOTE: this is deliberately a collection query, NOT a direct `doc(.../{email})`
 * read. The read rule references `resource.data.clientEmail`, and Firestore
 * DENIES a `get` on a non-existent document under such a rule — so a client with
 * no billing yet would hit a permission error. A query that matches nothing
 * returns an empty snapshot cleanly, which is what drives the empty state below
 * (and mirrors the projectUpdates subscription).
 *
 * `onData(null)` means the client has no billing document yet (the dashboard
 * then shows an empty state instead of mock figures).
 *
 * Returns the Firestore unsubscribe function.
 */
export function subscribeClientBilling(
  email: string,
  onData: (billing: ClientBilling | null) => void,
  onError: (error: FirestoreError) => void,
): () => void {
  const q = query(
    collection(db, PROJECT_BILLING_COLLECTION),
    where("clientEmail", "==", normalizeEmail(email)),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      let billing: ClientBilling | null = null;
      snapshot.forEach((docSnap) => {
        if (billing === null) billing = parseClientBilling(docSnap.data());
      });
      onData(billing);
    },
    onError,
  );
}
