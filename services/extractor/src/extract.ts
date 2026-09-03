import { z } from "zod";

export interface ExtractHint {
  category?: string;
}

export interface ExtractedAttributes {
  pattern?: string;
  occasion?: string;
  neckType?: string;
  sleeveLength?: string;
  sareeLength?: string;
  blousePiece?: boolean;
}

export interface ExtractResult {
  attributes: ExtractedAttributes;
  confidence: "low" | "medium" | "high";
  source: "heuristic" | "model";
}

// Deterministic, honest fallback: derives plausible attributes from the known
// product category rather than pretending to have analysed image pixels.
// Always flagged low_confidence/heuristic so nothing downstream mistakes this
// for a real vision result (fail-safe, never fail wrong).
export function extractHeuristic(hint: ExtractHint): ExtractResult {
  const category = (hint.category ?? "").toLowerCase();

  let attributes: ExtractedAttributes;
  if (category.includes("saree")) {
    attributes = { pattern: "Printed", occasion: "Festive", sareeLength: "6.3m", blousePiece: true };
  } else if (category.includes("kurti") || category.includes("top") || category.includes("dress")) {
    attributes = { pattern: "Solid", occasion: "Casual", neckType: "Round Neck", sleeveLength: "Three-Quarter" };
  } else {
    attributes = { pattern: "Solid", occasion: "Casual" };
  }

  return { attributes, confidence: "low", source: "heuristic" };
}

const modelAttributesSchema = z
  .object({
    neckType: z.string(),
    sleeveLength: z.string(),
    pattern: z.string(),
    occasion: z.string(),
    sareeLength: z.string(),
    blousePiece: z.boolean(),
  })
  .partial();

// A real vision model's text response may wrap JSON in prose or code fences.
// If we can't confidently extract and validate a JSON object shaped like
// ExtractedAttributes, return null so the caller falls back to the heuristic
// rather than guessing at a malformed result.
export function parseModelResponse(responseText: string): ExtractedAttributes | null {
  const match = responseText.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    const result = modelAttributesSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// moondream (and most small vision models) answer in natural-language prose,
// not JSON. This maps clearly-present keywords in that prose to the same
// attribute vocabulary the heuristic/compile pipeline expects. Only maps what
// is explicitly present in the text; never guesses. Returns null when nothing
// is found so the caller can fall back to the heuristic (fail-safe, never
// fabricate).
export function parseModelDescription(text: string): ExtractedAttributes | null {
  const lower = text.toLowerCase();
  const attributes: ExtractedAttributes = {};

  if (/round neck|crew neck/.test(lower)) {
    attributes.neckType = "Round Neck";
  } else if (/v-?\s?neck/.test(lower)) {
    attributes.neckType = "V-Neck";
  } else if (/boat neck/.test(lower)) {
    attributes.neckType = "Boat Neck";
  } else if (/collar/.test(lower)) {
    attributes.neckType = "Collar";
  }

  if (/full sleeve|long sleeve/.test(lower)) {
    attributes.sleeveLength = "Full Sleeve";
  } else if (/three.?quarter|3\/4/.test(lower)) {
    attributes.sleeveLength = "Three-Quarter";
  } else if (/half sleeve|short sleeve/.test(lower)) {
    attributes.sleeveLength = "Half Sleeve";
  } else if (/sleeveless/.test(lower)) {
    attributes.sleeveLength = "Sleeveless";
  }

  if (/floral/.test(lower)) {
    attributes.pattern = "Floral";
  } else if (/embroider/.test(lower)) {
    attributes.pattern = "Embroidered";
  } else if (/checked|checkered|plaid/.test(lower)) {
    attributes.pattern = "Checked";
  } else if (/striped?/.test(lower)) {
    attributes.pattern = "Striped";
  } else if (/print(ed)?/.test(lower)) {
    attributes.pattern = "Printed";
  } else if (/\bsolid\b/.test(lower)) {
    // "plain" is deliberately excluded: it too often describes a background or
    // color (e.g. "plain black background") rather than a garment's pattern,
    // and matching it risks fabricating an attribute from a non-clothing image.
    attributes.pattern = "Solid";
  }

  if (/party|festive|wedding|ethnic/.test(lower)) {
    attributes.occasion = "Festive";
  } else if (/casual|daily|everyday/.test(lower)) {
    attributes.occasion = "Casual";
  }

  if (/blouse piece|with blouse/.test(lower)) {
    attributes.blousePiece = true;
  }

  const sareeLengthMatch = lower.match(/(\d(?:\.\d)?)\s*m(?:etre)?s?\b/);
  if (sareeLengthMatch) {
    attributes.sareeLength = `${sareeLengthMatch[1]} metres`;
  }

  return Object.keys(attributes).length > 0 ? attributes : null;
}
