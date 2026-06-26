import { useEffect, useState } from "react";
import { subscribePublishedPortfolio } from "../services/portfolioService";
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

  useEffect(() => {
    const unsubscribe = subscribePublishedPortfolio(
      (projects) => setState({ projects, loading: false, error: false }),
      () => setState({ projects: [], loading: false, error: true }),
    );
    return unsubscribe;
  }, []);

  return state;
}
