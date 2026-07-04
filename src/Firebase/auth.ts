// Firebase Auth instance. Import this (not a monolithic firebase module) so
// auth-only screens don't pull the Firestore SDK into their chunk.
//
// Entry-graph code (AuthContext, Navbar handlers) must reach this module via
// dynamic import only — a static import would put the Auth SDK back into the
// initial bundle (issue #234).
import { getAuth } from "firebase/auth";
import { app } from "./app";

export const auth = getAuth(app);

// Re-exported so dynamic importers (AuthContext) get everything from this one
// wrapper. A direct `import("firebase/auth")` would retain the SDK's entire
// namespace in the bundle; this static re-export stays tree-shakeable.
export { onAuthStateChanged } from "firebase/auth";
