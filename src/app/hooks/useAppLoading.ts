import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  FALLBACK_MS,
  HERO_IMAGE_URL,
  MIN_DISPLAY_MS,
  MIN_DISPLAY_REDUCED_MS,
  PHASE_LABEL,
  type LoadingPhase,
} from "../constants/splash";

export interface AppLoadingState {
  /** Machine state: 'initializing' | 'assets' | 'preparing' | 'ready' | 'error'. */
  phase: LoadingPhase;
  /** Verbatim user-facing status string for the current phase. */
  label: string;
  /** 0..100, integer, monotonic while loading. */
  progress: number;
  isReady: boolean;
  isError: boolean;
  /** Resolved once at mount; never flips mid-load. */
  reducedMotion: boolean;
  /** Soft, in-place retry from the error fallback. */
  retry: () => void;
}

type SignalKey = "fonts" | "hero" | "load";

function phaseFromProgress(progress: number): LoadingPhase {
  if (progress >= 100) return "ready";
  if (progress >= 55) return "preparing";
  if (progress >= 20) return "assets";
  return "initializing";
}

/**
 * Drives the splash screen: a phase/progress state machine gated on real
 * resource signals (fonts, hero image, window load) plus a minimum display
 * floor, with a hard 10s fallback to an error state. Every signal path
 * resolves (never rejects) so a slow/blocked resource can't hang the splash.
 */
export function useAppLoading(): AppLoadingState {
  const prefersReducedMotion = useReducedMotion();

  // Resolve reduced-motion ONCE so visuals never flip mid-load.
  const reducedRef = useRef<boolean | null>(null);
  if (reducedRef.current === null) {
    reducedRef.current =
      Boolean(prefersReducedMotion) ||
      (typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  const reducedMotion = reducedRef.current;

  const [snapshot, setSnapshot] = useState<{
    phase: LoadingPhase;
    progress: number;
  }>({ phase: "initializing", progress: 0 });

  // Bumping runId re-runs the whole detection effect — this is the soft retry.
  const [runId, setRunId] = useState(0);

  const targetRef = useRef(0);
  const displayRef = useRef(0);
  const readyRef = useRef(false);
  const errorRef = useRef(false);
  const loggedRef = useRef(false);
  const signalsRef = useRef<Record<SignalKey, boolean>>({
    fonts: false,
    hero: false,
    load: false,
  });

  const retry = useCallback(() => {
    targetRef.current = 0;
    displayRef.current = 0;
    readyRef.current = false;
    errorRef.current = false;
    loggedRef.current = false;
    signalsRef.current = { fonts: false, hero: false, load: false };
    setSnapshot({ phase: "initializing", progress: 0 });
    setRunId((id) => id + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    const reduced = reducedRef.current ?? false;
    const minDisplayMs = reduced ? MIN_DISPLAY_REDUCED_MS : MIN_DISPLAY_MS;
    // Min-display counts from the true first paint (stamped in index.html),
    // not from React mount, so fast loads still honor the floor.
    const firstPaint =
      typeof window.__SERVIO_FP__ === "number"
        ? window.__SERVIO_FP__
        : performance.now();

    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let rafId: number | null = null;
    let fallbackId: ReturnType<typeof setTimeout> | null = null;

    targetRef.current = Math.max(targetRef.current, 15);

    const bump = (key: SignalKey, amount: number) => {
      if (signalsRef.current[key]) return;
      signalsRef.current[key] = true;
      targetRef.current = Math.min(90, targetRef.current + amount);
    };

    // --- hero image (cached-image safe; resolves on load OR error) ---
    const heroImg = new Image();
    const heroPromise = new Promise<void>((resolve) => {
      heroImg.decoding = "async";
      heroImg.onload = () => resolve();
      heroImg.onerror = () => {
        console.warn("[SplashScreen] hero image failed to preload");
        resolve();
      };
      heroImg.src = HERO_IMAGE_URL;
      // onload won't fire for an already-cached image.
      if (heroImg.complete) resolve();
    });

    // --- window load ---
    let loadListener: (() => void) | null = null;
    const loadPromise = new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      loadListener = () => resolve();
      window.addEventListener("load", loadListener, { once: true });
    });

    // --- fonts (guarded for browsers without the Font Loading API) ---
    const fontsPromise = new Promise<void>((resolve) => {
      const fontSet = document.fonts;
      if (!fontSet) {
        resolve();
        return;
      }
      fontSet.ready.then(() => resolve()).catch(() => resolve());
    });

    // Credit progress only on genuine completion of each signal (a hung signal
    // simply never credits — the bar still creeps toward its cap).
    fontsPromise.then(() => {
      if (mounted) bump("fonts", 25);
    });
    heroPromise.then(() => {
      if (mounted) bump("hero", 35);
    });
    loadPromise.then(() => {
      if (mounted) bump("load", 25);
    });

    const elapsed = performance.now() - firstPaint;
    const minDisplayPromise = new Promise<void>((resolve) => {
      const t = setTimeout(resolve, Math.max(0, minDisplayMs - elapsed));
      timeouts.push(t);
    });

    // Reveal only once the CRITICAL above-the-fold assets (fonts + hero image)
    // have genuinely finished AND the minimum display floor has elapsed. A
    // genuinely hung critical resource leaves this pending, so the 10s fallback
    // can win the race and surface the retry UI. (window 'load' waits for every
    // below-the-fold asset, so it feeds the progress bar but does NOT gate the
    // reveal — otherwise an image-heavy page could spuriously trip the fallback.)
    Promise.all([fontsPromise, heroPromise, minDisplayPromise]).then(() => {
      if (!mounted || errorRef.current) return;
      readyRef.current = true;
      targetRef.current = 100;
      if (fallbackId) clearTimeout(fallbackId);
    });

    fallbackId = setTimeout(() => {
      if (!mounted || readyRef.current) return;
      errorRef.current = true;
      if (!loggedRef.current) {
        loggedRef.current = true;
        console.error(
          `[SplashScreen] Critical resources failed to load within ${FALLBACK_MS}ms`,
          {
            progress: Math.round(displayRef.current),
            fontsReady: signalsRef.current.fonts,
            imageReady: signalsRef.current.hero,
            windowLoaded: signalsRef.current.load,
            readyState: document.readyState,
          },
        );
      }
    }, FALLBACK_MS);

    // rAF loop eases the displayed value toward the signal-driven target and
    // gently creeps (capped at 90) so the bar is never frozen before ready.
    const tick = () => {
      const target = targetRef.current;
      let display = displayRef.current + (target - displayRef.current) * 0.08;
      if (target - display < 1) {
        display = readyRef.current ? target : Math.min(90, display + 0.15);
      }
      displayRef.current = display;

      const progress = Math.round(display);
      const phase: LoadingPhase = errorRef.current
        ? "error"
        : phaseFromProgress(progress);

      if (mounted) {
        setSnapshot((prev) =>
          prev.phase === phase && prev.progress === progress
            ? prev
            : { phase, progress },
        );
      }

      const finished = errorRef.current || (readyRef.current && progress >= 100);
      if (!finished && mounted) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (fallbackId) clearTimeout(fallbackId);
      timeouts.forEach((t) => clearTimeout(t));
      if (loadListener) window.removeEventListener("load", loadListener);
      heroImg.onload = null;
      heroImg.onerror = null;
    };
  }, [runId]);

  return {
    phase: snapshot.phase,
    label: PHASE_LABEL[snapshot.phase],
    progress: snapshot.progress,
    isReady: snapshot.phase === "ready",
    isError: snapshot.phase === "error",
    reducedMotion,
    retry,
  };
}
