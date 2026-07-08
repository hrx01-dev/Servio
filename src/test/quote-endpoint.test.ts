/**
 * quote-endpoint.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Integration tests for the server-side quote endpoint (api/quote.ts) — the
 * authoritative rate-limit boundary added for issue #239. Firestore is mocked
 * with a tiny in-memory store so the real handler logic (validation, keyed-HMAC
 * IP hashing, transaction-based sliding window, fail-closed config checks) runs
 * end to end.
 *
 * Run with: npx vitest run src/test/quote-endpoint.test.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Firestore stand-in (shared across the mock) ───────────────────────────────
const store = new Map<string, Record<string, unknown>>();
const added: Record<string, Record<string, unknown>[]> = { messages: [], mail: [] };

vi.mock("firebase-admin/app", () => ({
  getApps: () => [{}], // pretend Admin is already initialised
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => {
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ({ __path: `${name}/${id}` }),
      add: async (data: Record<string, unknown>) => {
        (added[name] ??= []).push(data);
        return { id: "generated" };
      },
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

import handler from "../../api/quote";

// ── Test helpers ──────────────────────────────────────────────────────────────
const validForm = {
  name: "Sarah Chen",
  email: "sarah@company.com",
  phone: "",
  business: "TechStart Inc.",
  budget: "₹75,000 – ₹2,00,000",
  type: "Business Website",
  description: "Need a marketing site.",
};

function makeReq(body: unknown, ip = "1.2.3.4", method = "POST") {
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
  added.messages = [];
  added.mail = [];
  process.env.ALLOWED_ORIGIN = "https://servio-0.web.app";
  process.env.RATE_LIMIT_HASH_SECRET = "test-pepper";
  process.env.FIREBASE_SERVICE_ACCOUNT = "";
});

// ── Happy path ────────────────────────────────────────────────────────────────
describe("POST /api/quote — valid submission", () => {
  it("returns 200 and saves the lead + email", async () => {
    const res = makeRes();
    await handler(makeReq(validForm), res as never);
    expect(res.statusCode).toBe(200);
    expect(added.messages).toHaveLength(1);
    expect(added.mail).toHaveLength(1);
    expect((added.messages[0] as { email: string }).email).toBe("sarah@company.com");
  });
});

// ── Rate limiting (the issue #239 fix) ────────────────────────────────────────
describe("POST /api/quote — sliding-window rate limit (3 per window)", () => {
  it("allows the first 3 from one IP, then blocks the 4th with 429", async () => {
    const codes: number[] = [];
    for (let i = 0; i < 4; i++) {
      const res = makeRes();
      await handler(makeReq(validForm, "9.9.9.9"), res as never);
      codes.push(res.statusCode);
    }
    expect(codes).toEqual([200, 200, 200, 429]);
    // Only the 3 allowed submissions persisted a lead.
    expect(added.messages).toHaveLength(3);
  });

  it("sends a Retry-After header on the 429", async () => {
    let last = makeRes();
    for (let i = 0; i < 4; i++) {
      last = makeRes();
      await handler(makeReq(validForm, "7.7.7.7"), last as never);
    }
    expect(last.statusCode).toBe(429);
    expect(Number(last.headers["Retry-After"])).toBeGreaterThan(0);
  });

  it("tracks each IP independently", async () => {
    for (let i = 0; i < 3; i++) await handler(makeReq(validForm, "1.1.1.1"), makeRes() as never);
    const other = makeRes();
    await handler(makeReq(validForm, "2.2.2.2"), other as never);
    expect(other.statusCode).toBe(200); // a different IP is not rate-limited
  });
});

// ── Fail-closed config + validation ───────────────────────────────────────────
describe("POST /api/quote — fail closed & validation", () => {
  it("returns 500 when RATE_LIMIT_HASH_SECRET is not configured", async () => {
    delete process.env.RATE_LIMIT_HASH_SECRET;
    const res = makeRes();
    await handler(makeReq(validForm), res as never);
    expect(res.statusCode).toBe(500);
    expect(added.messages).toHaveLength(0);
  });

  it("returns 500 when ALLOWED_ORIGIN is not configured", async () => {
    delete process.env.ALLOWED_ORIGIN;
    const res = makeRes();
    await handler(makeReq(validForm), res as never);
    expect(res.statusCode).toBe(500);
  });

  it("returns 400 for an invalid submission (bad email)", async () => {
    const res = makeRes();
    await handler(makeReq({ ...validForm, email: "not-an-email" }), res as never);
    expect(res.statusCode).toBe(400);
    expect(added.messages).toHaveLength(0);
  });

  it("returns 405 for a non-POST method", async () => {
    const res = makeRes();
    await handler(makeReq(validForm, "1.2.3.4", "GET"), res as never);
    expect(res.statusCode).toBe(405);
  });
});
