/**
 * pinLockout.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the persistent PIN lockout state machine.
 *
 * These tests encode the two bugs from issue #117 as regression guards:
 *   1. The lockout must survive a sign-out (we never clear it on sign-out, only
 *      on success), so signing back in re-locks until the window expires.
 *   2. The failed-attempt count must survive a page refresh, so reloading
 *      between guesses cannot reset the counter and dodge the threshold.
 *
 * Run with: npx vitest run src/admin/lib/pinLockout.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  clearLockout,
  lockoutKey,
  LOCKOUT_DURATION_MS,
  MAX_ATTEMPTS,
  readLockout,
  recordFailure,
} from "./pinLockout";

const UID = "admin-123";
const T0 = 1_700_000_000_000; // fixed "now" so expiry math is deterministic

beforeEach(() => {
  localStorage.clear();
});

describe("readLockout", () => {
  it("returns a clean slate when nothing is stored", () => {
    expect(readLockout(UID, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("restores an in-progress attempt count (no lockout yet)", () => {
    recordFailure(UID, T0); // attempts -> 1
    expect(readLockout(UID, T0)).toEqual({ attempts: 1, lockedUntil: null });
  });

  it("reports an active lockout", () => {
    // Trip the lockout, then read while still inside the window.
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(UID, T0);
    const state = readLockout(UID, T0 + 1_000);
    expect(state.lockedUntil).toBe(T0 + LOCKOUT_DURATION_MS);
    expect(state.attempts).toBeGreaterThanOrEqual(MAX_ATTEMPTS);
  });

  it("reads an EXPIRED lockout as a clean slate (fresh attempts)", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(UID, T0);
    // One ms past the window — admin should get a fresh start, not be re-locked.
    const after = T0 + LOCKOUT_DURATION_MS + 1;
    expect(readLockout(UID, after)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("treats malformed JSON as a clean slate", () => {
    localStorage.setItem(lockoutKey(UID), "not json {");
    expect(readLockout(UID, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("treats a legacy plain-number entry as a clean slate", () => {
    // Old format stored just the expiry as a bare integer string.
    localStorage.setItem(lockoutKey(UID), String(T0 + LOCKOUT_DURATION_MS));
    expect(readLockout(UID, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("is scoped per uid", () => {
    recordFailure(UID, T0);
    expect(readLockout("someone-else", T0)).toEqual({
      attempts: 0,
      lockedUntil: null,
    });
  });
});

describe("recordFailure", () => {
  it("increments the persisted attempt count", () => {
    expect(recordFailure(UID, T0).attempts).toBe(1);
    expect(recordFailure(UID, T0).attempts).toBe(2);
  });

  it("survives a 'refresh' — re-reading storage keeps the count (bug #2)", () => {
    recordFailure(UID, T0); // 1
    recordFailure(UID, T0); // 2
    // Simulate a page reload: a brand-new read must still see 2 attempts, so the
    // next failure is the third and trips the lockout.
    expect(readLockout(UID, T0).attempts).toBe(2);
    const third = recordFailure(UID, T0);
    expect(third.attempts).toBe(MAX_ATTEMPTS);
    expect(third.lockedUntil).toBe(T0 + LOCKOUT_DURATION_MS);
  });

  it("trips the lockout exactly at MAX_ATTEMPTS", () => {
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      expect(recordFailure(UID, T0).lockedUntil).toBeNull();
    }
    expect(recordFailure(UID, T0).lockedUntil).toBe(T0 + LOCKOUT_DURATION_MS);
  });

  it("starts a fresh count after a previous lockout has expired", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(UID, T0);
    const after = T0 + LOCKOUT_DURATION_MS + 1;
    // First failure after expiry is attempt #1 again, not an instant re-lock.
    const next = recordFailure(UID, after);
    expect(next.attempts).toBe(1);
    expect(next.lockedUntil).toBeNull();
  });
});

describe("lockout survives sign-out (bug #1)", () => {
  it("stays locked across re-reads until cleared or expired", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(UID, T0);

    // doSignOut no longer clears the lockout. Modelling "sign out then sign back
    // in" as a fresh read within the window must still report locked.
    const onReturn = readLockout(UID, T0 + 5_000);
    expect(onReturn.lockedUntil).toBe(T0 + LOCKOUT_DURATION_MS);
  });

  it("clearLockout (success path) wipes the state", () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailure(UID, T0);
    clearLockout(UID);
    expect(readLockout(UID, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });
});
