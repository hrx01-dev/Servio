import { createContext } from "react";

export interface PinGateValue {
  /**
   * Ensure the security PIN has been verified for the current session.
   * Resolves true once verified (immediately if still within the window),
   * or false if the user cancels the challenge.
   */
  ensureVerified: () => Promise<boolean>;
  /**
   * Force a fresh PIN challenge, ignoring any active verification window.
   * Used by the explicit "Re-verify / Set up PIN" affordance so it always
   * opens the dialog. Resolves true on success, false if cancelled.
   */
  reverify: () => Promise<boolean>;
  /** True while inside the active verification window. */
  isVerified: boolean;
  /** Clear the current verification (e.g. on sign-out). */
  reset: () => void;
}

export const PinGateContext = createContext<PinGateValue | null>(null);

/** How long a single PIN verification stays valid. */
export const PIN_SESSION_TTL_MS = 5 * 60 * 1000;
