import {
  collection,
  onSnapshot,
  query,
  where,
  type FirestoreError,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import {
  parsePortfolioProject,
  sortByOrder,
  type PortfolioProject,
} from "../lib/portfolio";

/** Firestore collection holding admin-managed showcase projects. */
export const PORTFOLIO_COLLECTION = "portfolio";

/**
 * Subscribe in real time to the PUBLISHED portfolio projects. The query is a
 * single equality filter (`published == true`) so it needs no composite index;
 * results are sorted by display order client-side. The security rules release
 * only published items to the public, so unauthenticated visitors can read this
 * and admin changes appear live without a redeploy.
 *
 * Returns the Firestore unsubscribe function.
 */
export function subscribePublishedPortfolio(
  onData: (projects: PortfolioProject[]) => void,
  onError: (error: FirestoreError) => void,
): () => void {
  const q = query(
    collection(db, PORTFOLIO_COLLECTION),
    where("published", "==", true),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const projects: PortfolioProject[] = [];
      snapshot.forEach((docSnap) => {
        const parsed = parsePortfolioProject(docSnap.id, docSnap.data());
        if (parsed) projects.push(parsed);
      });
      projects.sort(sortByOrder);
      onData(projects);
    },
    onError,
  );
}
