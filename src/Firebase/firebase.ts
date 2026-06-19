// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// It's highly recommended to move this configuration to environment variables
// to avoid exposing sensitive keys in your source code.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "servio-0.firebaseapp.com",
    projectId: "servio-0",
    storageBucket: "servio-0.firebasestorage.app",
    messagingSenderId: "855251099693",
    appId: "1:855251099693:web:31cf254176ae6b90a018a4",
    measurementId: "G-ZGS1383K3N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);