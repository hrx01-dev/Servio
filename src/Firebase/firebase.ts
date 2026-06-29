import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics needs a browser environment with IndexedDB. Guarding init behind
// isSupported() (Firebase's own recommendation) keeps it silent during SSR,
// unit tests (jsdom), and unsupported browsers instead of logging an
// "IndexedDB unavailable" warning. Init is for auto page-view collection only —
// nothing reads this export — so a deferred, best-effort value is fine.
export const analytics = isSupported()
  .then((ok) => (ok ? getAnalytics(app) : null))
  .catch(() => null);