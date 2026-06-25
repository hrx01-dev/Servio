/**
 * Web Worker for off-thread PBKDF2-SHA256 PIN hashing.
 *
 * Running key-derivation here keeps the main thread fully unblocked
 * even at the OWASP-recommended 600 000 iteration count — the UI
 * spinner and animations continue smoothly while hashing is in progress.
 */

const DERIVED_BITS = 256;
const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

interface HashRequest {
  id: number;
  pin: string;
  salt: string;
  iterations: number;
}

interface HashResponse {
  id: number;
  hash?: string;
  error?: string;
}

self.onmessage = async (event: MessageEvent<HashRequest>) => {
  const { id, pin, salt, iterations } = event.data;
  try {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pin),
      { name: "PBKDF2" },
      false,
      ["deriveBits"],
    );
    const derived = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: encoder.encode(salt),
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      DERIVED_BITS,
    );
    (self as unknown as Worker).postMessage({
      id,
      hash: bytesToHex(new Uint8Array(derived)),
    } satisfies HashResponse);
  } catch (err) {
    (self as unknown as Worker).postMessage({
      id,
      error: String(err),
    } satisfies HashResponse);
  }
};
