/**
 * estimate-endpoint.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Integration tests for the per-IP throttle added to api/estimate.ts (issue
 * #210). Firestore and the Gemini SDK are mocked so the real handler logic
 * (fail-closed config checks, keyed-HMAC IP hashing, transaction-based sliding
 * window of 10 requests / 15 min) runs end to end.
 *
 * Run with: npx vitest run src/test/estimate-endpoint.test.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Firestore stand-in (shared across the mock) ───────────────────────────────
const store = new Map<string, Record<string, unknown>>();

// Mutable admin-init state, shared with the (hoisted) mock factory so a single
// test can force the "not yet initialised" path and exercise initAdmin()'s
// fail-closed branch.
const adminState = vi.hoisted(() => ({ appsInitialized: true }));

vi.mock("firebase-admin/app", () => ({
  // When appsInitialized is false, initAdmin() falls through to the
  // FIREBASE_SERVICE_ACCOUNT → JSON.parse → cert() branch (and its catch).
  getApps: () => (adminState.appsInitialized ? [{}] : []),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => {
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ({ __path: `${name}/${id}` }),
    }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        get: async (ref: { __path: string }) => {
          const data = store.get(ref.__path);
          return {
            exists: data !== undefined,
            get: (field: string) => data?.[field],
          };
        },
        set: (ref: { __path: string }, data: Record<string, unknown>) => {
          store.set(ref.__path, data);
        },
      };
      return fn(tx);
    },
  };
  return {
    getFirestore: () => db,
    FieldValue: { serverTimestamp: () => "__ts__" },
  };
});

// Mock the Gemini SDK so an allowed request returns a valid classification
// without hitting the network.
const generateContent = vi.fn(async () => ({
  response: {
    text: () =>
      JSON.stringify({
        projectType: "Business Website",
        overallComplexity: "medium",
        features: [{ name: "Contact form", category: "forms", complexity: "low" }],
        hasSignificantUnknowns: false,
      }),
  },
}));

vi.mock("@google/generative-ai", () => ({
  // Must be constructable with `new`, so a class — an arrow fn can't be a ctor.
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent };
    }
  },
}));

import handler from "../../api/estimate";

// ── Test helpers ──────────────────────────────────────────────────────────────
const validBody = {
  description: "A small business website with a contact form.",
  featureCategories: ["forms", "content"],
};

function makeReq(body: unknown, ip = "5.5.5.5", method = "POST") {
  return { method, headers: { "x-forwarded-for": ip }, body } as never;
}

function makeRes() {
  const res: {
    statusCode: number;
    payload: unknown;
    headers: Record<string, string>;
    ended: boolean;
    setHeader: (k: string, v: string) => void;
    status: (c: number) => typeof res;
    json: (p: unknown) => typeof res;
    end: () => typeof res;
  } = {
    statusCode: 0,
    payload: undefined,
    headers: {},
    ended: false,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(p) { this.payload = p; return this; },
    end() { this.ended = true; return this; },
  };
  return res;
}

beforeEach(() => {
  store.clear();
  generateContent.mockClear();
  adminState.appsInitialized = true; // default: Admin already initialised
  process.env.ALLOWED_ORIGIN = "https://servio-0.web.app";
  process.env.RATE_LIMIT_HASH_SECRET = "test-pepper";
  process.env.GEMINI_API_KEY = "test-key";
  process.env.FIREBASE_SERVICE_ACCOUNT = "";
});

// ── The throttle (issue #210) ─────────────────────────────────────────────────
describe("api/estimate — per-IP rate limit (10 per 15 min)", () => {
  it("allows the first 10 requests from one IP, then blocks the 11th with 429", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = makeRes();
      await handler(makeReq(validBody, "8.8.8.8"), res as never);
      codes.push(res.statusCode);
    }
    expect(codes.slice(0, 10)).toEqual(Array(10).fill(200));
    expect(codes[10]).toBe(429);
  });

  it("sends a Retry-After header on the 429", async () => {
    let last = makeRes();
    for (let i = 0; i < 11; i++) {
      last = makeRes();
      await handler(makeReq(validBody, "3.3.3.3"), last as never);
    }
    expect(last.statusCode).toBe(429);
    expect(Number(last.headers["Retry-After"])).toBeGreaterThan(0);
  });

  it("does not call the paid Gemini model once the limit is exceeded", async () => {
    for (let i = 0; i < 11; i++) {
      await handler(makeReq(validBody, "4.4.4.4"), makeRes() as never);
    }
    // 10 allowed → 10 model calls; the 11th is throttled before the model runs.
    expect(generateContent).toHaveBeenCalledTimes(10);
  });

  it("tracks each IP independently", async () => {
    for (let i = 0; i < 10; i++) await handler(makeReq(validBody, "1.1.1.1"), makeRes() as never);
    const other = makeRes();
    await handler(makeReq(validBody, "2.2.2.2"), other as never);
    expect(other.statusCode).toBe(200);
  });
});

// ── Fail-closed config ────────────────────────────────────────────────────────
describe("api/estimate — fail closed", () => {
  it("returns 500 when RATE_LIMIT_HASH_SECRET is not configured", async () => {
    delete process.env.RATE_LIMIT_HASH_SECRET;
    const res = makeRes();
    await handler(makeReq(validBody), res as never);
    expect(res.statusCode).toBe(500);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("returns 500 (not an uncaught throw) when Firebase Admin init fails", async () => {
    // Force the init path (Admin not yet initialised) with a malformed service
    // account so JSON.parse throws inside initAdmin() — the handler must fail
    // closed with a controlled 500, never crash or run the paid model.
    adminState.appsInitialized = false;
    process.env.FIREBASE_SERVICE_ACCOUNT = "{ not valid json";
    const res = makeRes();
    await expect(
      handler(makeReq(validBody, "6.6.6.6"), res as never),
    ).resolves.toBeDefined();
    expect(res.statusCode).toBe(500);
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("returns 405 for a non-POST method", async () => {
    const res = makeRes();
    await handler(makeReq(validBody, "5.5.5.5", "GET"), res as never);
    expect(res.statusCode).toBe(405);
  });
});
