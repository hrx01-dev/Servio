import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock_key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock_project",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123:web:123",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-123"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);