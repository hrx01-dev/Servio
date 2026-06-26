/**
 * useClientPayments.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the paymentErrorMessage helper (issue #198). Pins that each
 * Firestore error code maps to a specific, user-facing string and that the raw
 * Firebase error message is never surfaced directly to the client.
 *
 * Run with: npx vitest run src/dashboard/hooks/useClientPayments.test.ts
 */

import { describe, it, expect } from "vitest";
import { paymentErrorMessage } from "./useClientPayments";

describe("paymentErrorMessage", () => {
  it("returns a permission hint for permission-denied", () => {
    const msg = paymentErrorMessage("permission-denied");
    expect(msg).toContain("permission");
    expect(msg).not.toBe("");
  });

  it("returns a sign-in prompt for unauthenticated", () => {
    const msg = paymentErrorMessage("unauthenticated");
    expect(msg.toLowerCase()).toContain("sign in");
  });

  it("returns a temporary-outage message for unavailable", () => {
    const msg = paymentErrorMessage("unavailable");
    expect(msg.toLowerCase()).toContain("unavailable");
  });

  it("returns a generic fallback for any unknown code", () => {
    const msg = paymentErrorMessage("internal");
    expect(msg).toBeTruthy();
    expect(msg.toLowerCase()).toContain("couldn't load");
  });

  it("never exposes a raw Firebase error string to the user", () => {
    const codes: Array<Parameters<typeof paymentErrorMessage>[0]> = [
      "permission-denied",
      "unauthenticated",
      "unavailable",
      "internal",
      "not-found",
      "cancelled",
    ];
    for (const code of codes) {
      const msg = paymentErrorMessage(code);
      expect(msg).not.toMatch(/firebase|firestore|sdk|exception/i);
      expect(msg.length).toBeGreaterThan(0);
    }
  });

  it("each known code produces a distinct message", () => {
    const msgs = [
      paymentErrorMessage("permission-denied"),
      paymentErrorMessage("unauthenticated"),
      paymentErrorMessage("unavailable"),
    ];
    const unique = new Set(msgs);
    expect(unique.size).toBe(msgs.length);
  });
});
