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
import {
  computeEstimate,
  DEFAULT_PRICING,
  type AIClassification,
  type PricingConfig,
} from "../lib/estimation";

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
    // Fall back to defaults if the Firestore read fails or is denied.
  }
  return DEFAULT_PRICING;
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

  // Persisting history is best-effort: a failed save (transient Firestore error,
  // offline, etc.) must never hide the estimate the user just asked for. Skip
  // silently when there's no signed-in user to own the record.
  if (userId) {
    try {
      await addDoc(collection(db, "estimations"), {
        userId,
        description: trimmed,
        result: estimation,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Couldn't save estimation history:", err);
    }
  }

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
