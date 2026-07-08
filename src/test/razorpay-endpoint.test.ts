import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock firebase-admin
const store = new Map<string, Record<string, unknown>>();
const adminState = vi.hoisted(() => ({ appsInitialized: true }));

vi.mock("firebase-admin/app", () => ({
  getApps: () => (adminState.appsInitialized ? [{}] : []),
  initializeApp: vi.fn(),
  cert: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => {
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ({
        __path: `${name}/${id}`,
        get: async () => {
          const data = store.get(`${name}/${id}`);
          return {
            exists: data !== undefined,
            data: () => data,
          };
        },
        update: async (updates: Record<string, unknown>) => {
          const existing = store.get(`${name}/${id}`) || {};
          store.set(`${name}/${id}`, { ...existing, ...updates });
        },
      }),
    }),
  };
  return {
    getFirestore: () => db,
    FieldValue: { serverTimestamp: () => "__ts__" },
  };
});

// Mock Razorpay
const mockOrdersCreate = vi.fn();
const mockPaymentsFetch = vi.fn();

vi.mock("razorpay", () => {
  return {
    default: class Razorpay {
      orders = { create: mockOrdersCreate };
      payments = { fetch: mockPaymentsFetch };
    },
  };
});

import handler from "../../api/razorpay";
import crypto from "crypto";

function makeReq(
  body: unknown,
  query: Record<string, string> = {},
  method = "POST",
  origin = "https://servio-0.web.app"
) {
  return { method, headers: { origin }, query, body } as never;
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
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(c) {
      this.statusCode = c;
      return this;
    },
    json(p) {
      this.payload = p;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };
  return res;
}

beforeEach(() => {
  store.clear();
  mockOrdersCreate.mockClear();
  mockPaymentsFetch.mockClear();
  process.env.ALLOWED_ORIGIN = "https://servio-0.web.app";
  process.env.RAZORPAY_KEY_ID = "test-id";
  process.env.RAZORPAY_KEY_SECRET = "test-secret";
  process.env.FIREBASE_SERVICE_ACCOUNT = "";
});

describe("api/razorpay", () => {
  describe("CORS and methods", () => {
    it("handles OPTIONS preflight", async () => {
      const res = makeRes();
      await handler(makeReq({}, {}, "OPTIONS"), res as never);
      expect(res.statusCode).toBe(200);
      expect(res.headers["Access-Control-Allow-Methods"]).toContain("OPTIONS");
    });

    it("rejects non-POST methods", async () => {
      const res = makeRes();
      await handler(makeReq({}, {}, "GET"), res as never);
      expect(res.statusCode).toBe(405);
    });
  });

  describe("createOrder", () => {
    it("rejects missing action", async () => {
      const res = makeRes();
      await handler(makeReq({}, {}), res as never);
      expect(res.statusCode).toBe(400);
    });

    it("rejects invalid amount (negative or missing)", async () => {
      const res = makeRes();
      await handler(makeReq({ amount: -10, clientEmail: "a@b.com" }, { action: "createOrder" }), res as never);
      expect(res.statusCode).toBe(400);
    });

    it("guards against amount overflow (unsafe integer)", async () => {
      const res = makeRes();
      await handler(
        makeReq({ amount: Number.MAX_SAFE_INTEGER, clientEmail: "a@b.com" }, { action: "createOrder" }),
        res as never
      );
      expect(res.statusCode).toBe(400);
      expect(res.payload).toEqual({ error: "Amount is out of range" });
    });

    it("creates an order successfully", async () => {
      mockOrdersCreate.mockResolvedValueOnce({ id: "order_123", amount: 10000, currency: "INR" });
      const res = makeRes();
      await handler(makeReq({ amount: 100, clientEmail: "a@b.com" }, { action: "createOrder" }), res as never);
      expect(res.statusCode).toBe(200);
      expect(mockOrdersCreate).toHaveBeenCalledWith({
        amount: 10000,
        currency: "INR",
        receipt: expect.any(String),
      });
    });
  });

  describe("verifyPayment", () => {
    let validVerifyBody: Record<string, unknown>;

    beforeEach(() => {
      validVerifyBody = {
        razorpay_order_id: "order_123",
        razorpay_payment_id: "pay_123",
        razorpay_signature: "",
        clientEmail: "test@example.com",
        amount: 100,
      };

      const shasum = crypto.createHmac("sha256", "test-secret");
      shasum.update(`order_123|pay_123`);
      validVerifyBody.razorpay_signature = shasum.digest("hex");

      store.set("projectBilling/test@example.com", {
        payments: [],
      });
    });

    it("rejects missing fields", async () => {
      const res = makeRes();
      const body = { ...validVerifyBody };
      delete body.clientEmail;
      await handler(makeReq(body, { action: "verifyPayment" }), res as never);
      expect(res.statusCode).toBe(400);
    });

    it("rejects invalid signature", async () => {
      const res = makeRes();
      await handler(
        makeReq({ ...validVerifyBody, razorpay_signature: "invalid" }, { action: "verifyPayment" }),
        res as never
      );
      expect(res.statusCode).toBe(400);
      expect(res.payload).toEqual({ error: "Invalid signature" });
    });

    it("rejects if payment doesn't match order", async () => {
      mockPaymentsFetch.mockResolvedValueOnce({ order_id: "order_other", status: "captured", amount: 10000 });
      const res = makeRes();
      await handler(makeReq(validVerifyBody, { action: "verifyPayment" }), res as never);
      expect(res.statusCode).toBe(400);
      expect(res.payload).toEqual({ error: "Payment does not match order" });
    });

    it("rejects uncaptured payment", async () => {
      mockPaymentsFetch.mockResolvedValueOnce({ order_id: "order_123", status: "authorized", amount: 10000 });
      const res = makeRes();
      await handler(makeReq(validVerifyBody, { action: "verifyPayment" }), res as never);
      expect(res.statusCode).toBe(400);
      expect(res.payload).toEqual({ error: "Payment has not been captured" });
    });

    it("rejects if fetched amount doesn't match requested amount", async () => {
      mockPaymentsFetch.mockResolvedValueOnce({ order_id: "order_123", status: "captured", amount: 5000 });
      const res = makeRes();
      await handler(makeReq(validVerifyBody, { action: "verifyPayment" }), res as never);
      expect(res.statusCode).toBe(400);
      expect(res.payload).toEqual({ error: "Amount does not match the captured payment" });
    });

    it("successfully verifies and saves ad-hoc payment", async () => {
      mockPaymentsFetch.mockResolvedValueOnce({ order_id: "order_123", status: "captured", amount: 10000 });
      const res = makeRes();
      await handler(makeReq(validVerifyBody, { action: "verifyPayment" }), res as never);
      expect(res.statusCode).toBe(200);
      const data = store.get("projectBilling/test@example.com") as { payments: Array<Record<string, unknown>> };
      expect(data.payments[0].amount).toBe(100);
      expect(data.payments[0].id).toBe("pay_123");
    });
  });
});
