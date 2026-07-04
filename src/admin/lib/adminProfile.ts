// Firestore access for the signed-in user's `admins/{uid}` document.
//
// AdminContext mounts on every route (the shared Navbar reads isAdmin), so it
// reaches this module via dynamic import only — that keeps the Firestore SDK
// out of the render-blocking bundle (#234). The SDK imports here stay static
// so the bundler can tree-shake the SDK down to what's actually used (a
// dynamic `import("firebase/firestore")` would retain its whole namespace).
import {
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type FirestoreError,
  type Unsubscribe,
} from "firebase/firestore";
import { adminsCollection, parseAdminProfile } from "./collections";
import type { AdminProfile } from "../types";

export interface AdminProfileSnapshot {
  /** Whether the `admins/{uid}` document exists at all. */
  exists: boolean;
  /** Raw document data (diagnostics), null when the document is missing. */
  data: DocumentData | null;
  /** Parsed profile — null when missing or not a valid admin document. */
  profile: AdminProfile | null;
}

/** Subscribe in real time to `admins/{uid}`. Returns the unsubscribe fn. */
export function subscribeAdminProfile(
  uid: string,
  onData: (snapshot: AdminProfileSnapshot) => void,
  onError: (error: FirestoreError) => void,
): Unsubscribe {
  return onSnapshot(
    doc(adminsCollection, uid),
    (snapshot) => {
      const exists = snapshot.exists();
      const data = exists ? snapshot.data() : null;
      onData({
        exists,
        data,
        profile: exists ? parseAdminProfile(uid, data!) : null,
      });
    },
    onError,
  );
}

/** Stamp `admins/{uid}.lastLoginAt` with the server time. */
export function recordAdminLastLogin(uid: string): Promise<void> {
  return updateDoc(doc(adminsCollection, uid), {
    lastLoginAt: serverTimestamp(),
  });
}
