/**
 * loginLockout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistent failed-attempt / lockout state for the admin email-password login
 * page. Mirrors pinLockout.ts but is keyed by lowercased email rather than uid,
 * since the uid is not yet known when credentials are entered.
 *
 * Same caveats as pinLockout.ts: localStorage-only, so a determined attacker who
 * controls the browser (or uses a different device) can bypass it. The real
 * protection against credential stuffing is Firebase Authentication's own
 * server-side rate-limiter. This module raises the cost for casual brute-force
 * from a single browser and makes that limit survive page reloads.
 *
 * Because state is keyed per-browser by email, a lockout only affects the browser
 * running the attempts — it cannot be used to DoS another user's account.
 */

/** Maximum allowed consecutive failed login attempts before lockout. */
export const MAX_LOGIN_ATTEMPTS = 5;

/** How long a lockout lasts once triggered. */
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

const KEY_PREFIX = "admin_login_lockout_";

export type LoginLockoutState = {
  /** Consecutive failed attempts recorded so far. */
  attempts: number;
  /** Epoch ms when an active lockout expires, or `null` when not locked. */
  lockedUntil: number | null;
};

const EMPTY: LoginLockoutState = { attempts: 0, lockedUntil: null };

function storageKey(email: string): string {
  return KEY_PREFIX + email.toLowerCase().trim();
}

/**
 * Read the persisted lockout state for `email`, evaluated against `now`.
 *
 * An **expired** lockout returns a clean slate so the admin gets a fresh set of
 * attempts after the window passes. Malformed or unavailable storage also returns
 * empty.
 */
export function readLoginLockout(
  email: string,
  now: number = Date.now(),
): LoginLockoutState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(storageKey(email));
  } catch {
    return { ...EMPTY };
  }
  if (!raw) return { ...EMPTY };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...EMPTY };
  }
  if (typeof parsed !== "object" || parsed === null) return { ...EMPTY };

  const rec = parsed as { attempts?: unknown; lockedUntil?: unknown };
  const attempts =
    typeof rec.attempts === "number" &&
    Number.isFinite(rec.attempts) &&
    rec.attempts > 0
      ? Math.floor(rec.attempts)
      : 0;
  const until =
    typeof rec.lockedUntil === "number" && Number.isFinite(rec.lockedUntil)
      ? rec.lockedUntil
      : null;

  if (until !== null && now < until) {
    return { attempts: Math.max(attempts, MAX_LOGIN_ATTEMPTS), lockedUntil: until };
  }
  if (until !== null) {
    // Expired lockout — clean slate.
    return { ...EMPTY };
  }
  return { attempts, lockedUntil: null };
}

/**
 * Record one failed login attempt for `email` and persist the result.
 *
 * Once `attempts` reaches {@link MAX_LOGIN_ATTEMPTS} the returned `lockedUntil`
 * is set to `now + LOGIN_LOCKOUT_MS`.
 */
export function recordLoginFailure(
  email: string,
  now: number = Date.now(),
): LoginLockoutState {
  const current = readLoginLockout(email, now);
  const attempts = current.attempts + 1;
  const next: LoginLockoutState =
    attempts >= MAX_LOGIN_ATTEMPTS
      ? { attempts, lockedUntil: now + LOGIN_LOCKOUT_MS }
      : { attempts, lockedUntil: null };
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(next));
  } catch {
    /* storage unavailable — gate degrades gracefully */
  }
  return next;
}

/**
 * Clear all persisted lockout state for `email`. Call this only on a *successful*
 * sign-in — never on sign-out (the lockout must survive a sign-out/sign-in cycle
 * so an attacker cannot reset the counter by refreshing the page).
 */
export function clearLoginLockout(email: string): void {
  try {
    localStorage.removeItem(storageKey(email));
  } catch {
    /* ignore */
  }
}
