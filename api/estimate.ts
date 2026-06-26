import { GoogleGenerativeAI } from "@google/generative-ai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const COMPLEXITIES = new Set(["low", "medium", "high", "enterprise"]);

// Keep comfortably under the `estimations` create rule in firestore.rules, which
// requires `result.features.size() < 100`. Capping the classification here means
// a valid estimate can always be persisted to history (a real project never has
// anywhere near this many features anyway).
const MAX_FEATURES = 60;

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

function buildClassificationPrompt(featureCategories: string[]): string {
  const categoryList = featureCategories.map((c) => `"${c}"`).join(", ");

  return `You are a software project analyst. Your ONLY task is to extract and classify features from a project description.

AVAILABLE FEATURE CATEGORIES: [${categoryList}]

For each feature you identify:
1. Give it a human-readable name
2. Map it to the CLOSEST category from the list above
3. Rate its implementation complexity as one of: "low", "medium", "high", "enterprise"

Also determine:
- The overall project type (e.g., "E-commerce Platform", "Social Media App")
- The overall complexity: "low", "medium", "high", or "enterprise"
- Whether the project has significant unknowns or ambiguities (true/false)

You MUST respond with valid JSON only, no markdown, no code blocks.
Use this exact schema:
{
  "projectType": "string",
  "overallComplexity": "low" | "medium" | "high" | "enterprise",
  "features": [
    {
      "name": "Human-readable feature name",
      "category": "closest_category_from_list",
      "complexity": "low" | "medium" | "high" | "enterprise"
    }
  ],
  "hasSignificantUnknowns": boolean
}

Do NOT include any cost estimates, pricing, or monetary values.
Ensure all string values are properly escaped and that the output is strictly valid JSON.`;
}

function validateClassification(
  data: unknown,
  allowedCategories: Set<string>,
): AIClassification {
  const obj = data as Record<string, unknown>;

  if (
    typeof obj.projectType !== "string" ||
    !obj.projectType ||
    !COMPLEXITIES.has(obj.overallComplexity as string) ||
    !Array.isArray(obj.features) ||
    obj.features.length === 0 ||
    typeof obj.hasSignificantUnknowns !== "boolean"
  ) {
    throw new Error("Invalid classification structure");
  }

  // Be resilient to an occasional malformed feature from the model: skip an
  // entry with a missing name, an unknown category, or an invalid complexity
  // rather than failing the entire estimate. We still require at least one
  // usable feature below so the estimate stays meaningful.
  const features: AIFeature[] = [];
  for (const f of obj.features) {
    if (features.length >= MAX_FEATURES) {
      break;
    }
    if (typeof f !== "object" || f === null) {
      continue;
    }
    const feat = f as Record<string, unknown>;
    if (
      typeof feat.name !== "string" ||
      !feat.name ||
      typeof feat.category !== "string" ||
      !allowedCategories.has(feat.category as string) ||
      !COMPLEXITIES.has(feat.complexity as string)
    ) {
      continue;
    }
    features.push({
      name: feat.name,
      category: feat.category,
      complexity: feat.complexity as string,
    });
  }

  if (features.length === 0) {
    throw new Error("Invalid classification: no usable features");
  }

  return {
    projectType: obj.projectType as string,
    overallComplexity: obj.overallComplexity as string,
    features,
    hasSignificantUnknowns: obj.hasSignificantUnknowns as boolean,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 1. Configure CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // In production, you can replace '*' with your Firebase hosting URL for better security
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { description, featureCategories } = req.body;

    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "Missing project description" });
    }
    if (!Array.isArray(featureCategories)) {
      return res.status(400).json({ error: "Missing feature categories" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing Gemini API Key");
      return res.status(500).json({ error: "AI service is not configured on the server." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const classificationPrompt = buildClassificationPrompt(featureCategories);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${classificationPrompt}\n\nProject description:\n${description}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    if (!responseText || responseText.trim().length === 0) {
      throw new Error("AI returned an empty response.");
    }

    let parsed;
    try {
      // 1. Strip markdown
      let cleanText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      
      // 2. Extract just the JSON object if there's conversational text around it
      const match = cleanText.match(/\{[\s\S]*\}/);
      if (match) cleanText = match[0];

      // 3. Remove all literal newlines to prevent "unterminated string" errors
      cleanText = cleanText.replace(/[\r\n]+/g, ' ');
      
      // 4. Remove trailing commas
      cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');
      
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response. Raw response was:");
      console.error(responseText);
      throw parseError;
    }
    const classification = validateClassification(parsed, new Set(featureCategories));

    return res.status(200).json(classification);
  } catch (error: unknown) {
    console.error("Estimation Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process estimation";
    return res.status(500).json({ error: errorMessage });
  }
}
