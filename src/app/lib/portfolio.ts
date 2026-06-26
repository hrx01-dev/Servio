// Pure, dependency-free helpers for the public portfolio showcase. Kept free of
// any Firebase import so it stays trivially unit-testable; the service layer
// (portfolioService.ts) wires these to a Firestore subscription.

/** A published showcase project as consumed by the public marketing site. */
export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  industry: string;
  imageUrl: string;
  technologies: string[];
  /** Live demo URL; empty string when none ("Coming soon"). */
  projectUrl: string;
  githubUrl: string;
  order: number;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Parse a raw `portfolio` document into a PortfolioProject. Items without a
 * title are dropped (returning null) rather than rendered as blank cards. The
 * security rules already restrict the public read to published items, so this
 * layer only needs to be tolerant, not authoritative.
 */
export function parsePortfolioProject(
  id: string,
  data: Record<string, unknown>,
): PortfolioProject | null {
  const title = str(data.title).trim();
  if (!title) return null;
  return {
    id,
    title,
    description: str(data.description).trim(),
    category: str(data.category, "Other"),
    industry: str(data.industry),
    imageUrl: str(data.imageUrl),
    technologies: Array.isArray(data.technologies)
      ? data.technologies.filter((t): t is string => typeof t === "string")
      : [],
    projectUrl: str(data.projectUrl),
    githubUrl: str(data.githubUrl),
    order:
      typeof data.order === "number" && Number.isFinite(data.order)
        ? data.order
        : 0,
  };
}

/** Ascending by display order; ties broken by title for a stable layout. */
export function sortByOrder(a: PortfolioProject, b: PortfolioProject): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

/** Filter tabs derived from the live projects, always led by "All". */
export function deriveCategories(projects: PortfolioProject[]): string[] {
  const seen = new Set<string>();
  for (const p of projects) if (p.category) seen.add(p.category);
  return ["All", ...[...seen].sort()];
}
