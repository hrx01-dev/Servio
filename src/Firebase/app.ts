// Shared Firebase app instance. This module (and firebase/app) is the ONLY
// Firebase code that may be reached from more than one SDK entry point.
//
// The per-product instances live in sibling modules — auth.ts, db.ts,
// analytics.ts — so that importing one product never drags in the others
// (issue #234: the old firebase.ts initialised auth + firestore + analytics
// together, welding every Firebase SDK into a single ~734 KB vendor chunk that
// shipped with the first paint). Import the narrowest module you need.
import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
