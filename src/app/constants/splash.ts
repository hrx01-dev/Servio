// Single source of truth for the splash screen. Both the loading hook and the
// presentational component import from here so timings, the phase machine, and
// the preloaded hero URL can never drift apart.

// MUST byte-match the preload <link> in index.html and the heroImage in
// Hero.tsx — a mismatched query string triggers a second download.
export const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3ZWJzaXRlJTIwZGFzaGJvYXJkJTIwZGVzaWdufGVufDF8fHx8MTc4MTcwMjY1OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

/** Minimum time the splash stays up so the premium entrance is actually seen. */
export const MIN_DISPLAY_MS = 1600;
/** Shorter floor when the user prefers reduced motion. */
export const MIN_DISPLAY_REDUCED_MS = 800;
/** Hard ceiling — past this we surface the retry fallback and log a failure. */
export const FALLBACK_MS = 10000;
/** Overlay stacking context — above everything in the app. */
export const SPLASH_Z_INDEX = 9999;

export type LoadingPhase =
  | "initializing"
  | "assets"
  | "preparing"
  | "ready"
  | "error";

/** Verbatim user-facing status strings, derived from the typed phase. */
export const PHASE_LABEL: Record<LoadingPhase, string> = {
  initializing: "Initializing Application",
  assets: "Loading Assets",
  preparing: "Preparing Experience",
  ready: "Ready",
  error: "Something took too long to load",
};
