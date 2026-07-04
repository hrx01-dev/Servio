import { useEffect, useState } from "react";
import type { PortfolioProject } from "../lib/portfolio";

export interface PublishedPortfolioState {
  projects: PortfolioProject[];
  loading: boolean;
  /** True when the Firestore read failed (e.g. offline); projects is empty. */
  error: boolean;
}

/**
 * Live list of the published portfolio projects for the public marketing site.
 * On error it resolves to an empty list with `error: true` so the section can
 * fall back gracefully instead of breaking the page.
 */
export function usePublishedPortfolio(): PublishedPortfolioState {
  const [state, setState] = useState<PublishedPortfolioState>({
    projects: [],
    loading: true,
    error: false,
  });

  // The portfolio service (and with it the Firestore SDK) is loaded
  // dynamically after mount: this hook renders on the landing page, and a
  // static import would put Firestore into the render-blocking bundle (#234).
  // The section already shows its loading state until the first snapshot.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    import("../services/portfolioService")
      .then((m) => {
        if (cancelled) return;
        unsubscribe = m.subscribePublishedPortfolio(
          (projects) => setState({ projects, loading: false, error: false }),
          () => setState({ projects: [], loading: false, error: true }),
        );
      })
      .catch(() => {
        if (!cancelled) setState({ projects: [], loading: false, error: true });
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return state;
}
