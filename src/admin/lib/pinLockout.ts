/**
 * pinLockout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistent failed-attempt / lockout state for the admin Security PIN screen.
 *
 * This is a **client-side UX gate, not a security boundary** — real enforcement
 * of who may read/write admin data lives in `firestore.rules`. The job of this
 * module is to slow down online PIN guessing from a single browser and to make
 * that slowdown survive the obvious bypasses:
 *
 *   1. **Refresh evasion.** The running attempt count is persisted, so failing
 *      twice, refreshing, and trying again does *not* reset the counter back to
 *      zero — the third failure still trips the lockout.
 *
 *   2. **Sign-out evasion.** The lockout expiry is persisted and is **not**
 *      cleared on sign-out, so the forced sign-out that follows a lockout can't
 *      be used to immediately sign back in with a clean slate.
 *
 * State is keyed by uid in `localStorage`, which is already per-browser/device —
 * there is nothing here that should or does travel across devices.
 *
 * Every reader takes an explicit `now` (defaulting to `Date.now()`) so the
 * expiry logic is deterministically unit-testable.
 */

/** Maximum allowed consecutive failed PIN attempts before lockout. */
export const MAX_ATTEMPTS = 3;

/** How long a lockout lasts once triggered. */
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const KEY_PREFIX = "pin_lockout_";

export function lockoutKey(uid: string): string {
  return `${KEY_PREFIX}${uid}`;
}

export type LockoutState = {
  /** Consecutive failed attempts recorded so far. */
  attempts: number;
  /** Epoch ms when an active lockout expires, or `null` when not locked. */
  lockedUntil: number | null;
};

const EMPTY: LockoutState = { attempts: 0, lockedUntil: null };

/**
 * Read the persisted lockout state for `uid`, evaluated against `now`.
 *
 * Crucially, an **expired** lockout reads back as a clean slate
 * (`{ attempts: 0, lockedUntil: null }`): once the 15-minute window passes the
 * admin gets a fresh set of attempts rather than being instantly re-locked on
 * their next mistake. Malformed or unavailable storage also reads as empty.
 */
export function readLockout(uid: string, now: number = Date.now()): LockoutState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(lockoutKey(uid));
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
    // Active lockout — pin attempts at (at least) the threshold that tripped it.
    return { attempts: Math.max(attempts, MAX_ATTEMPTS), lockedUntil: until };
  }
  if (until !== null) {
    // Expired lockout — clean slate.
    return { ...EMPTY };
  }
  // No lockout yet — just the running attempt count.
  return { attempts, lockedUntil: null };
}

/**
 * Record one failed attempt for `uid` and persist the result.
 *
 * Returns the new state: once `attempts` reaches {@link MAX_ATTEMPTS} the
 * returned `lockedUntil` is set to `now + LOCKOUT_DURATION_MS`.
 */
export function recordFailure(uid: string, now: number = Date.now()): LockoutState {
  const current = readLockout(uid, now);
  const attempts = current.attempts + 1;
  const next: LockoutState =
    attempts >= MAX_ATTEMPTS
      ? { attempts, lockedUntil: now + LOCKOUT_DURATION_MS }
      : { attempts, lockedUntil: null };
  write(uid, next);
  return next;
}

/**
 * Clear all persisted lockout state for `uid`. Call this only on a *successful*
 * verification — never on sign-out (see the module header for why).
 */
export function clearLockout(uid: string): void {
  try {
    localStorage.removeItem(lockoutKey(uid));
  } catch {
    /* ignore */
  }
}

function write(uid: string, state: LockoutState): void {
  try {
    localStorage.setItem(lockoutKey(uid), JSON.stringify(state));
  } catch {
    /* storage unavailable — gate degrades to in-memory for this session */
  }
}
