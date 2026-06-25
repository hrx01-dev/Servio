import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PinGateContext,
  PinGateValue,
  PIN_SESSION_TTL_MS,
  ADMIN_SESSION_TIMEOUT_MS,
} from "./PinContextObject";
import { useAdmin } from "./useAdmin";
import { PinDialog } from "../components/PinDialog";

/**
 * Provides two layers of security-PIN state:
 *
 * 1. **Session gate** (`pinSessionVerified`): a boolean that must be `true`
 *    before any protected admin route is rendered. It is set by the dedicated
 *    PinVerifyPage / PinSetupPage on first login and cleared on sign-out.
 *
 * 2. **Action gate** (`ensureVerified` / `reverify`): the existing per-action
 *    TTL window used to guard sensitive mutations (delete, role change, etc.).
 *    Opening the action dialog calls `settle(true)` which also keeps the
 *    per-action TTL fresh.
 */
export function PinGateProvider({ children }: { children: ReactNode }) {
  const { admin } = useAdmin();

  // ── Per-action PIN dialog state ─────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [verifiedUntil, setVerifiedUntil] = useState<number | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  // ── Login-session PIN gate ──────────────────────────────────────────────
  const [pinSessionVerified, setPinSessionVerified] = useState(false);

  const completePinSession = useCallback(() => {
    setPinSessionVerified(true);
  }, []);

  const clearPinSession = useCallback(() => {
    setPinSessionVerified(false);
  }, []);

  // ── Inactivity session expiry ───────────────────────────────────────────
  // Track the last time the admin interacted with the page. When the session
  // is active, a 30-second interval checks whether they've been idle longer
  // than ADMIN_SESSION_TIMEOUT_MS; if so, pinSessionVerified is cleared and
  // RequirePinSession redirects them back to the PIN page.
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!pinSessionVerified) return;

    lastActivityRef.current = Date.now();

    const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    const onActivity = () => { lastActivityRef.current = Date.now(); };
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    const timerId = setInterval(() => {
      if (Date.now() - lastActivityRef.current > ADMIN_SESSION_TIMEOUT_MS) {
        setPinSessionVerified(false);
      }
    }, 30_000);

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      clearInterval(timerId);
    };
  }, [pinSessionVerified]);

  const settle = useCallback((ok: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    if (ok) setVerifiedUntil(Date.now() + PIN_SESSION_TTL_MS);
    resolve?.(ok);
  }, []);

  // Track the previous UID so we only reset state when the signed-in user
  // actually changes (sign-out or account switch). A plain `admin?.uid`
  // dependency would also fire whenever the admin document is updated in
  // Firestore (e.g. when the background PIN write lands and onSnapshot fires),
  // which would incorrectly wipe pinSessionVerified.
  const prevUidRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const uid = admin?.uid;
    if (uid === prevUidRef.current) return; // same user — do nothing
    prevUidRef.current = uid;
    // The admin identity changed (sign-in/sign-out) — drop all state.
    setVerifiedUntil(null);
    setPinSessionVerified(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setOpen(false);
  }, [admin?.uid]);

  // Open the dialog and wait for the user to verify or cancel. Replaces any
  // pending challenge (resolving the previous one false).
  const challenge = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setOpen(true);
    });
  }, []);

  const ensureVerified = useCallback(() => {
    if (verifiedUntil !== null && Date.now() < verifiedUntil) {
      return Promise.resolve(true);
    }
    return challenge();
  }, [verifiedUntil, challenge]);

  const reset = useCallback(() => setVerifiedUntil(null), []);

  const isVerified = verifiedUntil !== null && Date.now() < verifiedUntil;

  const value = useMemo<PinGateValue>(
    () => ({
      ensureVerified,
      reverify: challenge,
      isVerified,
      reset,
      pinSessionVerified,
      completePinSession,
      clearPinSession,
    }),
    [
      ensureVerified,
      challenge,
      isVerified,
      reset,
      pinSessionVerified,
      completePinSession,
      clearPinSession,
    ],
  );

  return (
    <PinGateContext.Provider value={value}>
      {children}
      <PinDialog
        open={open}
        admin={admin}
        onCancel={() => settle(false)}
        onSuccess={() => settle(true)}
      />
    </PinGateContext.Provider>
  );
}
