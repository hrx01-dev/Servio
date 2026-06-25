import { describe, it, expect } from "vitest";
import { validateFields, type QuoteFormData } from "./quoteValidation";

const base: QuoteFormData = {
  name: "Sarah Chen",
  email: "sarah@company.com",
  phone: "",
  business: "TechStart Inc.",
  budget: "$5,000 – $10,000",
  type: "Business Website",
  description: "Need a new marketing site.",
};

describe("validateFields", () => {
  it("accepts a complete, well-formed submission", () => {
    expect(validateFields(base)).toEqual({});
  });

  it("treats an empty phone as valid (optional field)", () => {
    expect(validateFields({ ...base, phone: "" }).phone).toBeUndefined();
  });

  it("accepts a normally formatted phone number", () => {
    expect(validateFields({ ...base, phone: "+1 (555) 123-4567" }).phone).toBeUndefined();
  });

  // Regression: a number that normalizes to a valid dialable form but whose raw
  // string is enormous must be rejected here, or the oversized composed body
  // would later be refused by the size-bounded Firestore write and lose the lead.
  it("rejects a phone whose raw string is absurdly long", () => {
    const huge = "(".repeat(5000) + "+15551234567" + ")".repeat(5000);
    expect(validateFields({ ...base, phone: huge }).phone).toBeDefined();
  });
});
