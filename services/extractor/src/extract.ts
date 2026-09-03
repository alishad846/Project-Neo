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
  confidence: "low" | "high";
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
