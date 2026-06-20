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
} from "./PinContextObject";
import { useAdmin } from "./useAdmin";
import { PinDialog } from "../components/PinDialog";

/**
 * Provides session-based security-PIN verification. Wrap the authenticated
 * admin area with this provider, then call `usePinGate().ensureVerified()`
 * before a sensitive action:
 *
 *   const { ensureVerified } = usePinGate();
 *   if (!(await ensureVerified())) return; // user cancelled
 *   await deleteProject(id);
 */
export function PinGateProvider({ children }: { children: ReactNode }) {
  const { admin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [verifiedUntil, setVerifiedUntil] = useState<number | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const settle = useCallback((ok: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    if (ok) setVerifiedUntil(Date.now() + PIN_SESSION_TTL_MS);
    resolve?.(ok);
  }, []);

  // When the signed-in admin changes (incl. sign-out), drop any verification
  // and abandon an in-flight challenge so a stale dialog/promise never lingers.
  useEffect(() => {
    setVerifiedUntil(null);
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
    () => ({ ensureVerified, reverify: challenge, isVerified, reset }),
    [ensureVerified, challenge, isVerified, reset],
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
