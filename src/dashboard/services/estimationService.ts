import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../Firebase/firebase";
import type { EstimationResult, EstimationRecord } from "../types";

interface PricingConfig {
  featurePricing: Record<string, number>;
  complexityMultipliers: Record<string, number>;
  minimumProjectCost: number;
  maximumProjectCost: number;
  bufferPercentage: number;
  riskFactorMultiplier: number;
}

interface AIFeature {
  name: string;
  category: string;
  complexity: string;
}

interface AIClassification {
  projectType: string;
  overallComplexity: string;
  features: AIFeature[];
  hasSignificantUnknowns: boolean;
}

const DEFAULT_PRICING: PricingConfig = {
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

async function getPricingConfig(): Promise<PricingConfig> {
  try {
    const snap = await getDoc(doc(db, "pricingConfig", "default"));
    if (snap.exists()) {
      const raw = snap.data() as Partial<PricingConfig>;
      const merged: PricingConfig = {
        ...DEFAULT_PRICING,
        ...raw,
        featurePricing: {
          ...DEFAULT_PRICING.featurePricing,
          ...(raw.featurePricing ?? {}),
        },
        complexityMultipliers: {
          ...DEFAULT_PRICING.complexityMultipliers,
          ...(raw.complexityMultipliers ?? {}),
        },
      };

      const isValid = (n: unknown): n is number =>
        typeof n === "number" && Number.isFinite(n);

      const validPrices = Object.values(merged.featurePricing).every(
        (v) => isValid(v) && v >= 0,
      );
      const validMultipliers = Object.values(
        merged.complexityMultipliers,
      ).every((v) => isValid(v) && v > 0);

      if (
        !isValid(merged.minimumProjectCost) ||
        !isValid(merged.maximumProjectCost) ||
        !isValid(merged.bufferPercentage) ||
        !isValid(merged.riskFactorMultiplier) ||
        merged.minimumProjectCost < 0 ||
        merged.maximumProjectCost < merged.minimumProjectCost ||
        merged.bufferPercentage < 0 ||
        merged.riskFactorMultiplier <= 0 ||
        !validPrices ||
        !validMultipliers
      ) {
        return DEFAULT_PRICING;
      }

      return merged;
    }
  } catch {
    // Fall back to defaults if Firestore read fails
  }
  return DEFAULT_PRICING;
}


function computeEstimate(
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

export async function analyzeProject(
  description: string,
  userId: string,
): Promise<EstimationResult> {
  const trimmed = description.trim();
  if (trimmed.length < 10) {
    throw new Error(
      "Please provide a more detailed project description (at least 10 characters).",
    );
  }
  if (trimmed.length > 5000) {
    throw new Error(
      "Project description is too long (maximum 5000 characters).",
    );
  }

  const pricing = await getPricingConfig();
  const featureCategories = Object.keys(pricing.featurePricing);

  // Use VITE_API_BASE_URL if it exists (for production when Firebase calls Vercel).
  // Otherwise, default to empty string (for local development via Vite proxy).
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

  // Call the Vercel Serverless Function instead of Google Gemini directly
  const response = await fetch(`${baseUrl}/api/estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: trimmed,
      featureCategories,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch estimation from server.";
    try {
      const errorData = await response.json();
      if (errorData.error) errorMessage = errorData.error;
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  const classification = await response.json() as AIClassification;
  const estimation = computeEstimate(classification, pricing);

  if (!userId) {
    throw new Error("You must be signed in to save estimation history.");
  }

  await addDoc(collection(db, "estimations"), {
    userId,
    description: trimmed,
    result: estimation,
    createdAt: new Date().toISOString(),
  });

  return estimation;
}

export async function fetchEstimationHistory(
  uid: string,
): Promise<EstimationRecord[]> {
  const q = query(
    collection(db, "estimations"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc"),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as EstimationRecord[];
}
