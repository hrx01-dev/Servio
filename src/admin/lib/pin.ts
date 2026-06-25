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
 *
 * Iteration count: 600 000 meets the OWASP 2023 recommendation for
 * PBKDF2-HMAC-SHA256. The count is stored per-credential so existing PINs
 * hashed at a different count still verify correctly. Hashing runs in a
 * dedicated Web Worker (pin.worker.ts) so the main thread is never blocked.
 */

export const PIN_ITERATIONS = 600_000;
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

// ── Web Worker singleton ────────────────────────────────────────────────────
// One worker is shared across all hash calls; requests are correlated by id.

let _worker: Worker | null = null;
let _requestId = 0;
const _pending = new Map<
  number,
  { resolve: (h: string) => void; reject: (e: Error) => void }
>();

function getHashWorker(): Worker {
  if (!_worker) {
    _worker = new Worker(new URL("./pin.worker.ts", import.meta.url), {
      type: "module",
    });
    _worker.onmessage = (
      e: MessageEvent<{ id: number; hash?: string; error?: string }>,
    ) => {
      const { id, hash, error } = e.data;
      const pending = _pending.get(id);
      if (!pending) return;
      _pending.delete(id);
      if (error) pending.reject(new Error(error));
      else if (hash !== undefined) pending.resolve(hash);
      else pending.reject(new Error("Worker returned no hash"));
    };
    _worker.onerror = (e) => {
      // Reject all in-flight requests and reset so the next call spawns fresh.
      for (const [, { reject }] of _pending) {
        reject(new Error(e.message ?? "Worker error"));
      }
      _pending.clear();
      _worker = null;
    };
  }
  return _worker;
}

/** Hash `pin` via the Web Worker (off main thread). Falls back to main thread
 *  if the Worker API is unavailable (e.g. old browsers / SSR). */
export async function hashPin(
  pin: string,
  salt: string,
  iterations: number = PIN_ITERATIONS,
): Promise<string> {
  if (typeof Worker === "undefined") {
    // Fallback: run on main thread (will block UI at high iteration counts).
    return hashPinMainThread(pin, salt, iterations);
  }
  const id = ++_requestId;
  return new Promise<string>((resolve, reject) => {
    _pending.set(id, { resolve, reject });
    getHashWorker().postMessage({ id, pin, salt, iterations });
  });
}

async function hashPinMainThread(
  pin: string,
  salt: string,
  iterations: number,
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
