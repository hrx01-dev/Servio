import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
  type Transition,
  type Variants,
} from "motion/react";
import { SPLASH_Z_INDEX, type LoadingPhase } from "../constants/splash";

// Heavy Three.js scene is code-split so it never blocks the splash's first paint.
const SplashCanvas = lazy(() => import("./splash/SplashCanvas"));

/** If WebGL fails to init, render nothing so the CSS-only splash remains. */
class CanvasErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

interface SplashScreenProps {
  phase: LoadingPhase;
  label: string;
  progress: number;
  isError: boolean;
  reducedMotion: boolean;
  onRetry: () => void;
}

const ENTRANCE_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const EXIT_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const OVERLAY_BG =
  "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0f0f1a 100%)";

export function SplashScreen({
  phase,
  label,
  progress,
  isError,
  reducedMotion,
  onRetry,
}: SplashScreenProps) {
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const r = reducedMotion;

  // The error fallback is the one legitimate modal: focus its action and keep
  // focus pinned to it (the sole control) until the user retries.
  useEffect(() => {
    if (!isError) return;
    retryButtonRef.current?.focus();
    const onFocusIn = (event: FocusEvent) => {
      const overlay = overlayRef.current;
      if (
        overlay &&
        event.target instanceof Node &&
        !overlay.contains(event.target)
      ) {
        retryButtonRef.current?.focus();
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [isError]);

  const overlayVariants: Variants = {
    // The dark background is present immediately (no fade-in on the overlay);
    // only the inner card/children animate in. The overlay lifts away on exit.
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
    exit: {
      opacity: 0,
      y: r ? 0 : -16,
      // Promote to its own layer only for the exit transform/fade.
      willChange: "transform, opacity",
      transition: { duration: r ? 0.2 : 0.8, ease: EXIT_EASE },
    },
  };

  const cardVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: r ? 1 : 0.92,
      y: r ? 0 : 8,
      willChange: r ? "auto" : "transform, opacity",
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: r ? 0.2 : 0.6,
        ease: ENTRANCE_EASE,
        staggerChildren: r ? 0 : 0.08,
        delayChildren: r ? 0 : 0.1,
      },
      // Release the compositor hint once the entrance is done (it is not
      // auto-managed in this motion/react ESM build).
      transitionEnd: { willChange: "auto" },
    },
  };

  const childVariants: Variants = {
    hidden: { opacity: 0, y: r ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: r ? 0.2 : 0.5, ease: ENTRANCE_EASE },
    },
  };

  const floatTransition: Transition | undefined = r
    ? undefined
    : { duration: 4, repeat: Infinity, ease: "easeInOut" };

  const ariaProps: HTMLMotionProps<"div"> = isError
    ? {
        role: "alertdialog",
        "aria-modal": true,
        "aria-labelledby": "splash-error-title",
        "aria-describedby": "splash-error-desc",
      }
    : {
        // The live region lives on the status node below (not the whole overlay)
        // so only the phase label is announced — never the per-frame progress.
        "aria-busy": phase !== "ready",
        "aria-label": "Loading Servio",
      };

  const fillScale = Math.min(1, Math.max(0, progress / 100));

  return (
    <motion.div
      ref={overlayRef}
      {...ariaProps}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onKeyDown={(event) => {
        if (!isError) return;
        // Error modal: trap Tab on the single control; Escape retries.
        if (event.key === "Tab") event.preventDefault();
        else if (event.key === "Escape") onRetry();
      }}
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        zIndex: SPLASH_Z_INDEX,
        background: OVERLAY_BG,
        // Block interaction with the landing while the splash is up; let clicks
        // pass through only during the exit cross-fade (phase === "ready").
        pointerEvents: phase === "ready" ? "none" : "auto",
      }}
    >
      {/* Decorative glow blobs (transform/opacity only — never animate blur). */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-indigo-600/30 blur-2xl md:blur-3xl"
          animate={r ? undefined : { opacity: [0.35, 0.6, 0.35], scale: [1, 1.08, 1] }}
          transition={r ? undefined : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-purple-600/30 blur-2xl md:blur-3xl"
          animate={r ? undefined : { opacity: [0.5, 0.3, 0.5], scale: [1.08, 1, 1.08] }}
          transition={r ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/15 blur-2xl md:blur-3xl"
          animate={r ? undefined : { opacity: [0.25, 0.45, 0.25] }}
          transition={r ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* WebGL liquid-glass layer — code-split, skipped under reduced motion,
          and gracefully absent if WebGL fails (CSS glow above remains). */}
      {!r && (
        <CanvasErrorBoundary>
          <Suspense fallback={null}>
            <SplashCanvas progress={progress} isReady={phase === "ready"} />
          </Suspense>
        </CanvasErrorBoundary>
      )}

      {/* Cinematic vignette for depth (above the WebGL layer, below the card). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <motion.div
        variants={cardVariants}
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/5 px-6 py-9 text-center shadow-2xl shadow-black/40 backdrop-blur-xl md:gap-6 md:px-10 md:py-12"
      >
        {isError ? (
          <>
            <div
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-3xl"
            >
              ⚠️
            </div>
            <h2
              id="splash-error-title"
              className="text-xl font-bold text-white md:text-2xl"
            >
              {label}
            </h2>
            <p id="splash-error-desc" className="text-sm text-slate-400">
              Please check your connection and try again.
            </p>
            <button
              ref={retryButtonRef}
              type="button"
              onClick={onRetry}
              className="mt-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              Retry
            </button>
          </>
        ) : (
          <>
            {/* Logo cluster: entrance (variant) wraps an independent idle float. */}
            <motion.div variants={childVariants}>
              <motion.div
                className="relative h-20 w-20 md:h-24 md:w-24"
                animate={r ? undefined : { y: [0, -8, 0] }}
                transition={floatTransition}
              >
                {/* Rotating conic ring, masked to a thin ring. */}
                <motion.div
                  aria-hidden="true"
                  className="absolute -inset-2 rounded-full"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, #4F46E5 110deg, #7C3AED 200deg, #06B6D4 300deg, transparent 360deg)",
                    WebkitMask:
                      "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
                  }}
                  animate={r ? undefined : { rotate: 360 }}
                  transition={
                    r ? undefined : { duration: 1.4, repeat: Infinity, ease: "linear" }
                  }
                />
                {/* Servio logo mark (matches the Navbar). */}
                <div className="absolute inset-[6px] flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
                  <span className="text-3xl font-bold text-white md:text-4xl">S</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.span
              variants={childVariants}
              className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
            >
              Servio
            </motion.span>

            <motion.p
              variants={childVariants}
              className="-mt-2 text-sm text-slate-400 md:text-base"
            >
              Crafting your premium web experience
            </motion.p>

            {/* Progress bar — composited scaleX fill, no text inside. */}
            <motion.div
              variants={childVariants}
              role="progressbar"
              aria-label="Loading progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              className="h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-white/10 md:max-w-[260px]"
            >
              <motion.div
                className="h-full origin-left rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"
                style={{ transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: fillScale }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </motion.div>

            {/* Dynamic status — announced on phase change (not per-percent). */}
            <motion.div
              variants={childVariants}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="flex h-5 items-center justify-center"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: r ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: r ? 0 : -4 }}
                  transition={{ duration: r ? 0.15 : 0.25 }}
                  className="text-sm text-slate-300"
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
