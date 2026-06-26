/**
 * estimation.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sample tests that pin the AI estimator's pricing/timeline behaviour (issue
 * #184). The AI only classifies a project; all cost math is deterministic and
 * lives in computeEstimate, so it can be checked exactly.
 *
 * Run with: npx vitest run src/dashboard/lib/estimation.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  computeEstimate,
  DEFAULT_PRICING,
  type AIClassification,
  type AIFeature,
} from "./estimation";

function classification(
  partial: Partial<AIClassification> = {},
): AIClassification {
  return {
    projectType: "Web App",
    overallComplexity: "medium",
    features: [],
    hasSignificantUnknowns: false,
    ...partial,
  };
}

const feat = (category: string, complexity: string, name = category): AIFeature => ({
  name,
  category,
  complexity,
});

/** N cheap low-complexity features — used to drive featureCount for timelines. */
const cheap = (n: number): AIFeature[] =>
  Array.from({ length: n }, (_, i) => feat("seo_optimization", "low", `f${i}`));

describe("computeEstimate — cost", () => {
  it("sums feature price × complexity multiplier and adds the buffer for the max", () => {
    // 5000×1.0 + 12000×1.3 + 15000×1.7 = 5000 + 15600 + 25500 = 46100
    const result = computeEstimate(
      classification({
        overallComplexity: "high",
        features: [
          feat("authentication", "low"),
          feat("payment_gateway", "medium"),
          feat("dashboard", "high"),
        ],
      }),
      DEFAULT_PRICING,
    );
    expect(result.estimatedCostMin).toBe(46100);
    expect(result.estimatedCostMax).toBe(53015); // round(46100 × 1.15)
    expect(result.projectType).toBe("Web App");
    expect(result.overallComplexity).toBe("high");
    expect(result.features).toHaveLength(3);
  });

  it("clamps the cost to the configured minimum", () => {
    const result = computeEstimate(
      classification({
        overallComplexity: "low",
        features: [feat("responsive_design", "low")], // 4000 < 10000 floor
      }),
      DEFAULT_PRICING,
    );
    expect(result.estimatedCostMin).toBe(DEFAULT_PRICING.minimumProjectCost);
    expect(result.estimatedCostMax).toBe(DEFAULT_PRICING.minimumProjectCost);
  });

  it("clamps the cost to the configured maximum", () => {
    // 20 × (16000 × 2.2 = 35200) = 704000, well above the 500000 cap.
    const result = computeEstimate(
      classification({
        overallComplexity: "enterprise",
        features: Array.from({ length: 20 }, (_, i) =>
          feat("media_streaming", "enterprise", `stream-${i}`),
        ),
      }),
      DEFAULT_PRICING,
    );
    expect(result.estimatedCostMin).toBe(DEFAULT_PRICING.maximumProjectCost);
    expect(result.estimatedCostMax).toBe(DEFAULT_PRICING.maximumProjectCost);
  });

  it("applies the risk multiplier when the scope has significant unknowns", () => {
    // 15000 × 1.3 = 19500, × 1.1 risk = 21450
    const result = computeEstimate(
      classification({
        features: [feat("dashboard", "medium")],
        hasSignificantUnknowns: true,
      }),
      DEFAULT_PRICING,
    );
    expect(result.estimatedCostMin).toBe(21450);
    expect(result.explanation).toContain("buffer for ambiguities");
  });

  it("falls back to a base price for unknown categories and a medium multiplier for unknown complexity", () => {
    // unknown category → 5000 base; "exotic" complexity → 1.3 multiplier
    // (5000 × 1.3) + (5000 × 1.3) = 6500 + 6500 = 13000
    const result = computeEstimate(
      classification({
        features: [
          feat("totally_unknown_cat", "medium", "Mystery"),
          feat("authentication", "exotic", "Weird"),
        ],
      }),
      DEFAULT_PRICING,
    );
    expect(result.estimatedCostMin).toBe(13000);
  });

  it("never lets estimatedCostMax fall below estimatedCostMin", () => {
    for (const c of ["low", "medium", "high", "enterprise"]) {
      const result = computeEstimate(
        classification({ overallComplexity: c, features: cheap(4) }),
        DEFAULT_PRICING,
      );
      expect(result.estimatedCostMax).toBeGreaterThanOrEqual(
        result.estimatedCostMin,
      );
    }
  });
});

describe("computeEstimate — effort labels", () => {
  it("maps each complexity to a human effort label", () => {
    const result = computeEstimate(
      classification({
        features: [
          feat("authentication", "low"),
          feat("dashboard", "medium"),
          feat("payment_gateway", "high"),
          feat("real_time_features", "enterprise"),
          feat("api_integration", "exotic"),
        ],
      }),
      DEFAULT_PRICING,
    );
    expect(result.features.map((f) => f.estimatedEffort)).toEqual([
      "Low",
      "Medium",
      "High",
      "High",
      "Medium", // unknown complexity degrades to Medium
    ]);
  });
});

describe("computeEstimate — timeline", () => {
  const cases: [string, number, string][] = [
    ["low", 3, "2-3 weeks"],
    ["low", 4, "3-5 weeks"],
    ["medium", 5, "4-6 weeks"],
    ["medium", 6, "6-8 weeks"],
    ["high", 5, "6-10 weeks"],
    ["high", 6, "8-12 weeks"],
    ["enterprise", 2, "12-16 weeks"],
  ];

  it.each(cases)(
    "%s complexity with %i features → %s",
    (complexity, count, expected) => {
      const result = computeEstimate(
        classification({ overallComplexity: complexity, features: cheap(count) }),
        DEFAULT_PRICING,
      );
      expect(result.estimatedTimeline).toBe(expected);
    },
  );
});
