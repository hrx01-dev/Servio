/**
 * Security-PIN hashing for sensitive admin actions.
 *
 * PINs are hashed with PBKDF2-SHA256 (Web Crypto) using a per-admin random
 * salt, and only the hash + salt + iteration count are stored in Firestore.
 *
 * IMPORTANT — security model: client-side hashing protects the PIN at rest in
 * the database, but it is NOT a substitute for server-side verification. A
 * production hardening step is to move `verifyPin` into a Cloud Function and
 * gate sensitive writes on a short-lived verification claim. This module is
 * intentionally written so that swapping the backend only touches these
 * functions. See docs/ADMIN.md → "Security PIN".
 */

const PIN_ITERATIONS = 150_000;
const DERIVED_BITS = 256;
const encoder = new TextEncoder();

/** Required PIN length (digits). */
export const PIN_LENGTH = 6;

const PIN_PATTERN = new RegExp(`^\\d{${PIN_LENGTH}}$`);

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Cryptographically-random hex salt. */
export function generateSalt(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashPin(
  pin: string,
  salt: string,
  iterations: number = PIN_ITERATIONS,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations, hash: "SHA-256" },
    keyMaterial,
    DERIVED_BITS,
  );
  return bytesToHex(new Uint8Array(derived));
}

/** Length-stable comparison to avoid leaking match position via timing. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export interface PinCredential {
  hash: string;
  salt: string;
  iterations: number;
}

/** Produce a storable credential from a fresh PIN. */
export async function createPinCredential(pin: string): Promise<PinCredential> {
  const salt = generateSalt();
  const hash = await hashPin(pin, salt, PIN_ITERATIONS);
  return { hash, salt, iterations: PIN_ITERATIONS };
}

/** Verify a candidate PIN against a stored credential. */
export async function verifyPin(
  pin: string,
  credential: { hash: string; salt: string; iterations?: number },
): Promise<boolean> {
  const actual = await hashPin(
    pin,
    credential.salt,
    credential.iterations ?? PIN_ITERATIONS,
  );
  return constantTimeEqual(actual, credential.hash);
}
