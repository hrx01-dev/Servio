// Cloud Firestore instance. Import this (not a monolithic firebase module) so
// data-layer code doesn't pull the Auth SDK into its chunk.
//
// Entry-graph code (AdminContext, submitQuote, usePublishedPortfolio) must
// reach this module via dynamic import only — a static import would put the
// Firestore SDK (the heaviest Firebase product) back into the initial bundle
// (issue #234).
import { getFirestore } from "firebase/firestore";
import { app } from "./app";

export const db = getFirestore(app);
