/**
 * authError.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for Firebase Auth error-code → user-friendly message mapping
 * (issue #241).
 *
 * Covers:
 *   - Unauthenticated access: invalid credentials are surfaced clearly
 *   - Revoked / disabled account: auth/user-disabled shows an actionable message
 *   - Network / server errors: not exposed as raw Firebase strings
 *   - Rate-limiting: too-many-requests surfaces a wait message
 *   - Unknown codes and non-object errors fall back gracefully
 *
 * Run with: npx vitest run src/admin/lib/authError.test.ts
 */

import { describe, it, expect } from "vitest";
import { authErrorMessage } from "./authError";

function makeError(code: string) {
  return { code };
}

// ─── Unauthenticated / invalid credentials ───────────────────────────────────

describe("authErrorMessage — unauthenticated access", () => {
  it("maps auth/invalid-credential to a generic bad-credentials message", () => {
    expect(authErrorMessage(makeError("auth/invalid-credential"))).toBe(
      "Invalid email or password.",
    );
  });

  it("maps auth/wrong-password to the same generic bad-credentials message", () => {
    expect(authErrorMessage(makeError("auth/wrong-password"))).toBe(
      "Invalid email or password.",
    );
  });

  it("maps auth/user-not-found to the same generic bad-credentials message", () => {
    // Deliberately the same string as wrong-password so attackers cannot enumerate accounts.
    expect(authErrorMessage(makeError("auth/user-not-found"))).toBe(
      "Invalid email or password.",
    );
  });

  it("maps auth/invalid-email to an email-format prompt", () => {
    expect(authErrorMessage(makeError("auth/invalid-email"))).toBe(
      "Enter a valid email address.",
    );
  });
});

// ─── Revoked / disabled session ──────────────────────────────────────────────

describe("authErrorMessage — revoked / disabled account", () => {
  it("maps auth/user-disabled to an account-disabled message", () => {
    expect(authErrorMessage(makeError("auth/user-disabled"))).toBe(
      "This account has been disabled.",
    );
  });
});

// ─── Rate-limiting ────────────────────────────────────────────────────────────

describe("authErrorMessage — rate-limiting", () => {
  it("maps auth/too-many-requests to a wait-and-retry message", () => {
    expect(authErrorMessage(makeError("auth/too-many-requests"))).toBe(
      "Too many attempts. Please try again in a few minutes.",
    );
  });
});

// ─── Network errors ───────────────────────────────────────────────────────────

describe("authErrorMessage — network errors", () => {
  it("maps auth/network-request-failed to a connection message", () => {
    expect(authErrorMessage(makeError("auth/network-request-failed"))).toBe(
      "Network error. Check your connection and try again.",
    );
  });
});

// ─── Fallback handling ────────────────────────────────────────────────────────

describe("authErrorMessage — fallback for unexpected errors", () => {
  it("returns the fallback for an unrecognised Firebase error code", () => {
    expect(authErrorMessage(makeError("auth/internal-error"))).toBe(
      "Could not sign in. Please try again.",
    );
  });

  it("returns the fallback for a non-object error (string)", () => {
    expect(authErrorMessage("something went wrong")).toBe(
      "Could not sign in. Please try again.",
    );
  });

  it("returns the fallback for null", () => {
    expect(authErrorMessage(null)).toBe("Could not sign in. Please try again.");
  });

  it("returns the fallback for undefined", () => {
    expect(authErrorMessage(undefined)).toBe("Could not sign in. Please try again.");
  });

  it("returns the fallback for a plain Error with no code property", () => {
    expect(authErrorMessage(new Error("raw message"))).toBe(
      "Could not sign in. Please try again.",
    );
  });

  it("returns the fallback for an object with a non-string code", () => {
    expect(authErrorMessage({ code: 403 })).toBe(
      "Could not sign in. Please try again.",
    );
  });
});
