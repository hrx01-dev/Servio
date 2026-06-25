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

  // ── Login-session PIN gate ──────────────────────────────────────────────
  /**
   * True once the admin has passed the full-page PIN check for the current
   * login session. Required before any protected admin route is accessible.
   * Cleared on sign-out or whenever the admin identity changes.
   */
  pinSessionVerified: boolean;
  /**
   * Mark the current login session as PIN-verified. Call this from the
   * PinVerifyPage / PinSetupPage after a successful PIN check or setup.
   */
  completePinSession: () => void;
  /**
   * Explicitly clear the session-level PIN flag (called on sign-out).
   */
  clearPinSession: () => void;
}

export const PinGateContext = createContext<PinGateValue | null>(null);

/** How long a single PIN verification stays valid. */
export const PIN_SESSION_TTL_MS = 5 * 60 * 1000;

/** Inactivity period after which the admin PIN session is expired. */
export const ADMIN_SESSION_TIMEOUT_MS = 30 * 60 * 1000;
