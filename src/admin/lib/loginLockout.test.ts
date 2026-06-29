/**
 * loginLockout.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the persistent login lockout state machine (issue #241).
 *
 * Covers:
 *   - Unauthenticated brute-force: 5 consecutive failures trigger a lockout
 *   - Expired session / lockout window: expired lockout resets the counter
 *   - Lockout survives page refresh (attempt count persisted to localStorage)
 *   - Lockout survives sign-out (state is only cleared on success)
 *   - Email-keyed (not uid): lockout is scoped per email address
 *   - Email normalisation: case and whitespace are ignored
 *   - Malformed / unavailable storage degrades gracefully
 *   - Successful sign-in clears the lockout
 *
 * Run with: npx vitest run src/admin/lib/loginLockout.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  clearLoginLockout,
  LOGIN_LOCKOUT_MS,
  MAX_LOGIN_ATTEMPTS,
  readLoginLockout,
  recordLoginFailure,
} from "./loginLockout";

const EMAIL = "admin@example.com";
const T0 = 1_700_000_000_000; // fixed "now" so expiry math is deterministic

beforeEach(() => {
  localStorage.clear();
});

// ─── readLoginLockout ─────────────────────────────────────────────────────────

describe("readLoginLockout", () => {
  it("returns a clean slate when nothing is stored", () => {
    expect(readLoginLockout(EMAIL, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("restores an in-progress attempt count (no lockout yet)", () => {
    recordLoginFailure(EMAIL, T0);
    expect(readLoginLockout(EMAIL, T0)).toEqual({ attempts: 1, lockedUntil: null });
  });

  it("reports an active lockout while inside the window", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) recordLoginFailure(EMAIL, T0);
    const state = readLoginLockout(EMAIL, T0 + 1_000);
    expect(state.lockedUntil).toBe(T0 + LOGIN_LOCKOUT_MS);
    expect(state.attempts).toBeGreaterThanOrEqual(MAX_LOGIN_ATTEMPTS);
  });

  it("reads an EXPIRED lockout as a clean slate (fresh attempts after window)", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) recordLoginFailure(EMAIL, T0);
    const after = T0 + LOGIN_LOCKOUT_MS + 1;
    expect(readLoginLockout(EMAIL, after)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("treats malformed JSON as a clean slate", () => {
    localStorage.setItem("admin_login_lockout_admin@example.com", "not json {");
    expect(readLoginLockout(EMAIL, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("is scoped per email — different address starts clean", () => {
    recordLoginFailure(EMAIL, T0);
    expect(readLoginLockout("other@example.com", T0)).toEqual({
      attempts: 0,
      lockedUntil: null,
    });
  });

  it("normalises email case so lockout is shared across case variants", () => {
    recordLoginFailure("Admin@Example.COM", T0);
    expect(readLoginLockout("admin@example.com", T0).attempts).toBe(1);
  });

  it("normalises leading/trailing whitespace in email", () => {
    recordLoginFailure("  admin@example.com  ", T0);
    expect(readLoginLockout("admin@example.com", T0).attempts).toBe(1);
  });
});

// ─── recordLoginFailure ───────────────────────────────────────────────────────

describe("recordLoginFailure — unauthenticated brute-force protection", () => {
  it("increments the persisted attempt count on each failure", () => {
    expect(recordLoginFailure(EMAIL, T0).attempts).toBe(1);
    expect(recordLoginFailure(EMAIL, T0).attempts).toBe(2);
    expect(recordLoginFailure(EMAIL, T0).attempts).toBe(3);
  });

  it("does not set lockedUntil before reaching MAX_LOGIN_ATTEMPTS", () => {
    for (let i = 1; i < MAX_LOGIN_ATTEMPTS; i++) {
      expect(recordLoginFailure(EMAIL, T0).lockedUntil).toBeNull();
    }
  });

  it("trips the lockout exactly at MAX_LOGIN_ATTEMPTS", () => {
    for (let i = 1; i < MAX_LOGIN_ATTEMPTS; i++) recordLoginFailure(EMAIL, T0);
    const last = recordLoginFailure(EMAIL, T0);
    expect(last.attempts).toBe(MAX_LOGIN_ATTEMPTS);
    expect(last.lockedUntil).toBe(T0 + LOGIN_LOCKOUT_MS);
  });

  it("survives a page refresh — re-reading storage preserves the count", () => {
    recordLoginFailure(EMAIL, T0); // 1
    recordLoginFailure(EMAIL, T0); // 2
    // Simulate reload: fresh read must still see 2, so the next failure is #3.
    expect(readLoginLockout(EMAIL, T0).attempts).toBe(2);
    const third = recordLoginFailure(EMAIL, T0);
    expect(third.attempts).toBe(3);
  });

  it("starts a fresh count after the lockout window has expired", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) recordLoginFailure(EMAIL, T0);
    const after = T0 + LOGIN_LOCKOUT_MS + 1;
    const next = recordLoginFailure(EMAIL, after);
    expect(next.attempts).toBe(1);
    expect(next.lockedUntil).toBeNull();
  });
});

// ─── Lockout survives sign-out ────────────────────────────────────────────────

describe("lockout survives sign-out", () => {
  it("stays locked on re-read after sign-out while window is active", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) recordLoginFailure(EMAIL, T0);

    // Modelling "sign out then attempt sign-in again" as a fresh read.
    const onReturn = readLoginLockout(EMAIL, T0 + 5_000);
    expect(onReturn.lockedUntil).toBe(T0 + LOGIN_LOCKOUT_MS);
  });

  it("only clearLoginLockout (success path) removes the lockout", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) recordLoginFailure(EMAIL, T0);
    clearLoginLockout(EMAIL);
    expect(readLoginLockout(EMAIL, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });
});

// ─── clearLoginLockout ────────────────────────────────────────────────────────

describe("clearLoginLockout — successful sign-in resets state", () => {
  it("clears a partial attempt count before lockout", () => {
    recordLoginFailure(EMAIL, T0);
    recordLoginFailure(EMAIL, T0);
    clearLoginLockout(EMAIL);
    expect(readLoginLockout(EMAIL, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("clears an active lockout", () => {
    for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) recordLoginFailure(EMAIL, T0);
    clearLoginLockout(EMAIL);
    expect(readLoginLockout(EMAIL, T0)).toEqual({ attempts: 0, lockedUntil: null });
  });

  it("is a no-op when there is nothing stored", () => {
    expect(() => clearLoginLockout(EMAIL)).not.toThrow();
  });

  it("only clears the target email — other addresses are unaffected", () => {
    recordLoginFailure("other@example.com", T0);
    clearLoginLockout(EMAIL);
    expect(readLoginLockout("other@example.com", T0).attempts).toBe(1);
  });
});
