import { useCallback } from "react";
import { usePinGate } from "../context/usePinGate";

/**
 * Returns a runner that gates an action behind security-PIN verification.
 *
 *   const runSensitive = useSensitiveAction();
 *   await runSensitive(async () => deleteProject(id));
 *
 * Resolves true if the action ran, false if the PIN challenge was cancelled.
 */
export function useSensitiveAction() {
  const { ensureVerified } = usePinGate();
  return useCallback(
    async (action: () => void | Promise<void>): Promise<boolean> => {
      const ok = await ensureVerified();
      if (!ok) return false;
      await action();
      return true;
    },
    [ensureVerified],
  );
}
