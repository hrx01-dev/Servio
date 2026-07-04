// Firebase Analytics init — dynamically imported from RootLayout after mount,
// keeping the Analytics SDK out of the render-blocking bundle (issue #234).
//
// Analytics needs a browser environment with IndexedDB. Guarding init behind
// isSupported() (Firebase's own recommendation) keeps it silent during SSR,
// unit tests (jsdom), and unsupported browsers instead of logging an
// "IndexedDB unavailable" warning. Init is for auto page-view collection only —
// nothing reads this export — so a deferred, best-effort value is fine.
import { getAnalytics, isSupported } from "firebase/analytics";
import { app } from "./app";

export const analytics = isSupported()
  .then((ok) => (ok ? getAnalytics(app) : null))
  .catch(() => null);
