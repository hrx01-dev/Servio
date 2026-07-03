import {
  collection,
  onSnapshot,
  query,
  where,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "../../Firebase/db";
import {
  normalizeEmail,
  parseClientUpdate,
  sortByNewest,
  type ClientUpdate,
} from "../lib/updates";

/** Firestore collection holding admin-authored, client-addressed updates. */
export const PROJECT_UPDATES_COLLECTION = "projectUpdates";

/**
 * Subscribe in real time to the updates addressed to `email`. The query is a
 * single equality filter (no orderBy → no composite index, mirroring the admin
 * data layer) and we sort newest-first client-side. The security rules ensure a
 * client only ever receives documents matching their own verified token email.
 *
 * Returns the Firestore unsubscribe function.
 */
export function subscribeClientUpdates(
  email: string,
  onData: (updates: ClientUpdate[]) => void,
  onError: (error: FirestoreError) => void,
): () => void {
  const q = query(
    collection(db, PROJECT_UPDATES_COLLECTION),
    where("clientEmail", "==", normalizeEmail(email)),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const updates: ClientUpdate[] = [];
      snapshot.forEach((docSnap) => {
        const parsed = parseClientUpdate(docSnap.id, docSnap.data());
        if (parsed) updates.push(parsed);
      });
      updates.sort(sortByNewest);
      onData(updates);
    },
    onError,
  );
}
