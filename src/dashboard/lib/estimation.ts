// Pure, dependency-free core of the AI project estimator. Kept free of any
// Firebase import so it stays trivially unit-testable (mirroring lib/updates.ts
// and lib/payments.ts); estimationService.ts wires this to Firestore + the AI
// classification endpoint.
//
// The AI endpoint only CLASSIFIES a project (type, features, complexity); all
// pricing/timeline math lives here so it is deterministic and testable.

import type { EstimationResult } from "../types";

export interface PricingConfig {
  featurePricing: Record<string, number>;
  complexityMultipliers: Record<string, number>;
  minimumProjectCost: number;
  maximumProjectCost: number;
  bufferPercentage: number;
  riskFactorMultiplier: number;
}

export interface AIFeature {
  name: string;
  category: string;
  complexity: string;
}

export interface AIClassification {
  projectType: string;
  overallComplexity: string;
  features: AIFeature[];
  hasSignificantUnknowns: boolean;
}

export const DEFAULT_PRICING: PricingConfig = {
  featurePricing: {
    authentication: 5000,
    dashboard: 15000,
    payment_gateway: 12000,
    real_time_features: 18000,
    database_crud: 8000,
    file_upload: 6000,
    search_functionality: 7000,
    notifications: 5000,
    api_integration: 10000,
    analytics: 8000,
    user_management: 7000,
    responsive_design: 4000,
    seo_optimization: 3000,
    social_login: 4000,
    email_service: 5000,
    chat_messaging: 14000,
    maps_geolocation: 9000,
    media_streaming: 16000,
    cms_content_management: 12000,
    ecommerce_cart: 15000,
    order_management: 12000,
    inventory_management: 10000,
    reporting: 9000,
    multi_language: 6000,
    accessibility: 5000,
  },
  complexityMultipliers: {
    low: 1.0,
    medium: 1.3,
    high: 1.7,
    enterprise: 2.2,
  },
  minimumProjectCost: 10000,
  maximumProjectCost: 500000,
  bufferPercentage: 15,
  riskFactorMultiplier: 1.1,
};

/**
 * Turn an AI classification into a concrete cost/timeline estimate. Unknown
 * feature categories fall back to a base price, and unknown complexities to the
 * medium multiplier, so a slightly-off classification still yields a sensible
 * number. Costs are clamped to the configured [min, max] band; the max line
 * adds the configured buffer, and an ambiguous scope adds a risk multiplier.
 */
export function computeEstimate(
  classification: AIClassification,
  pricing: PricingConfig,
): EstimationResult {
  const fallbackBase = 5000;

  let totalBaseCost = 0;
  const featureResults = classification.features.map((f) => {
    const basePrice = pricing.featurePricing[f.category] ?? fallbackBase;
    const multiplier = pricing.complexityMultipliers[f.complexity] ?? 1.3;
    const featureCost = basePrice * multiplier;
    totalBaseCost += featureCost;

    const effortLabel =
      f.complexity === "low"
        ? "Low"
        : f.complexity === "enterprise" || f.complexity === "high"
          ? "High"
          : "Medium";

    return {
      name: f.name,
      complexity: f.complexity as "low" | "medium" | "high" | "enterprise",
      estimatedEffort: effortLabel,
    };
  });

  if (classification.hasSignificantUnknowns) {
    totalBaseCost *= pricing.riskFactorMultiplier;
  }

  const bufferFraction = pricing.bufferPercentage / 100;
  let costMin = Math.round(totalBaseCost);
  let costMax = Math.round(totalBaseCost * (1 + bufferFraction));

  costMin = Math.max(
    pricing.minimumProjectCost,
    Math.min(pricing.maximumProjectCost, costMin),
  );
  costMax = Math.max(
    costMin,
    Math.min(pricing.maximumProjectCost, costMax),
  );

  const featureCount = classification.features.length;
  let timeline: string;
  if (classification.overallComplexity === "low" && featureCount <= 3) {
    timeline = "2-3 weeks";
  } else if (classification.overallComplexity === "low") {
    timeline = "3-5 weeks";
  } else if (
    classification.overallComplexity === "medium" &&
    featureCount <= 5
  ) {
    timeline = "4-6 weeks";
  } else if (classification.overallComplexity === "medium") {
    timeline = "6-8 weeks";
  } else if (
    classification.overallComplexity === "high" &&
    featureCount <= 5
  ) {
    timeline = "6-10 weeks";
  } else if (classification.overallComplexity === "high") {
    timeline = "8-12 weeks";
  } else {
    timeline = "12-16 weeks";
  }

  const highComplexCount = classification.features.filter(
    (f) => f.complexity === "high" || f.complexity === "enterprise",
  ).length;

  const explanationParts: string[] = [];
  explanationParts.push(
    `This ${classification.projectType.toLowerCase()} project involves ${featureCount} distinct feature${featureCount !== 1 ? "s" : ""}.`,
  );
  if (highComplexCount > 0) {
    explanationParts.push(
      `${highComplexCount} of these require${highComplexCount === 1 ? "s" : ""} advanced implementation effort, contributing to the overall ${classification.overallComplexity} complexity rating.`,
    );
  }
  if (classification.hasSignificantUnknowns) {
    explanationParts.push(
      "The estimate includes an additional buffer for ambiguities in the project scope.",
    );
  }
  explanationParts.push(
    `The estimated timeline of ${timeline} accounts for development, integration, and testing phases.`,
  );

  return {
    projectType: classification.projectType,
    overallComplexity:
      classification.overallComplexity as EstimationResult["overallComplexity"],
    features: featureResults,
    estimatedCostMin: costMin,
    estimatedCostMax: costMax,
    estimatedTimeline: timeline,
    explanation: explanationParts.join(" "),
  };
}
