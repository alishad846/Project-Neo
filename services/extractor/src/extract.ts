import { z } from "zod";

export interface ExtractHint {
  category?: string;
  sellerPriors?: {
    frequentColors?: string[];
    frequentFabrics?: string[];
    frequentPatterns?: string[];
    frequentNeckTypes?: string[];
    frequentSleeveLengths?: string[];
    recentAttributes?: Array<Record<string, unknown>>;
  };
}

export interface ExtractedAttributes {
  color?: string;
  fabric?: string;
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

// Canonical normalization maps for standard Meesho e-commerce attributes
const NECK_TYPES: Array<[RegExp, string]> = [
  [/round|crew/i, "Round Neck"],
  [/v-?\s?neck/i, "V-Neck"],
  [/boat\s?neck/i, "Boat Neck"],
  [/collar|shirt\s?collar/i, "Collar"],
  [/square\s?neck/i, "Square Neck"],
  [/mandarin|chinese|banded/i, "Mandarin / Chinese Neck"],
  [/halter/i, "Halter Neck"],
  [/sweetheart/i, "Sweetheart"],
  [/off-?shoulder/i, "Off-Shoulder"],
  [/hood(ed)?/i, "Hooded"],
  [/scoop/i, "Scoop Neck"],
];

const SLEEVE_LENGTHS: Array<[RegExp, string]> = [
  [/full\s?sleeve|long\s?sleeve/i, "Full Sleeve"],
  [/three[- ]?quarter|3\/4/i, "Three-Quarter"],
  [/half\s?sleeve|short\s?sleeve/i, "Half Sleeve"],
  [/sleeveless/i, "Sleeveless"],
  [/cap\s?sleeve/i, "Cap Sleeve"],
];

const PATTERNS: Array<[RegExp, string]> = [
  [/floral/i, "Floral"],
  [/embroider(ed|y)?/i, "Embroidered"],
  [/check(ed|ered)?|plaid/i, "Checked"],
  [/strip(ed|es)?/i, "Striped"],
  [/print(ed)?/i, "Printed"],
  [/solid|plain/i, "Solid"],
  [/geometric/i, "Geometric"],
  [/self\s?design/i, "Self Design"],
  [/embellish(ed)?/i, "Embellished"],
  [/color\s?block(ed)?/i, "Colorblocked"],
  [/woven/i, "Woven Design"],
];

const OCCASIONS: Array<[RegExp, string]> = [
  [/festive|ethnic|wedding|party|traditional/i, "Festive"],
  [/casual|daily|everyday/i, "Casual"],
  [/formal|office|work/i, "Formal"],
];

const COLOR_PATTERNS: Array<[RegExp, string]> = [
  [/navy\s*blue/i, "Navy Blue"],
  [/olive\s*green|olive/i, "Olive Green"],
  [/sky\s*blue|light\s*blue/i, "Light Blue"],
  [/dark\s*green/i, "Dark Green"],
  [/maroon/i, "Maroon"],
  [/\bred\b/i, "Red"],
  [/\bpink\b/i, "Pink"],
  [/\borange\b/i, "Orange"],
  [/\byellow\b/i, "Yellow"],
  [/mustard/i, "Mustard"],
  [/\bgreen\b/i, "Green"],
  [/\bteal\b/i, "Teal"],
  [/\bblue\b/i, "Blue"],
  [/\bpurple\b|violet/i, "Purple"],
  [/\bblack\b/i, "Black"],
  [/\bwhite\b/i, "White"],
  [/\bgr[ae]y\b/i, "Grey"],
  [/\bbrown\b/i, "Brown"],
  [/beige/i, "Beige"],
  [/cream|off.?white/i, "Cream"],
  [/\bgold\b/i, "Gold"],
  [/\bsilver\b/i, "Silver"],
  [/multi.?colou?r/i, "Multicolor"],
];

const FABRIC_PATTERNS: Array<[RegExp, string]> = [
  [/cotton\s*blend/i, "Cotton Blend"],
  [/\bcotton\b/i, "Cotton"],
  [/polyester/i, "Polyester"],
  [/\bsilk\b/i, "Silk"],
  [/\bwool(len)?\b/i, "Wool"],
  [/denim/i, "Denim"],
  [/\blinen\b/i, "Linen"],
  [/rayon/i, "Rayon"],
  [/viscose/i, "Viscose"],
  [/georgette/i, "Georgette"],
  [/chiffon/i, "Chiffon"],
  [/velvet/i, "Velvet"],
  [/\bnylon\b/i, "Nylon"],
  [/\bnet\b/i, "Net"],
  [/crepe/i, "Crepe"],
  [/satin/i, "Satin"],
];

function normalizeAttribute(value: unknown, patterns: Array<[RegExp, string]>): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  for (const [re, canonical] of patterns) {
    if (re.test(value)) return canonical;
  }
  return value.trim();
}

function normalizeColor(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  for (const [re, canonical] of COLOR_PATTERNS) {
    if (re.test(value)) return canonical;
  }
  return value.trim();
}

function normalizeFabric(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  for (const [re, canonical] of FABRIC_PATTERNS) {
    if (re.test(value)) return canonical;
  }
  return value.trim();
}

const rawModelAttributesSchema = z
  .object({
    color: z.unknown().optional(),
    fabric: z.unknown().optional(),
    neckType: z.unknown().optional(),
    sleeveLength: z.unknown().optional(),
    pattern: z.unknown().optional(),
    occasion: z.unknown().optional(),
    sareeLength: z.unknown().optional(),
    blousePiece: z.unknown().optional(),
  })
  .partial();

export function normalizeExtractedAttributes(raw: Record<string, unknown>): ExtractedAttributes {
  const result: ExtractedAttributes = {};

  if (raw.color) {
    const norm = normalizeColor(raw.color);
    if (norm) result.color = norm;
  }
  if (raw.fabric) {
    const norm = normalizeFabric(raw.fabric);
    if (norm) result.fabric = norm;
  }
  if (raw.neckType) {
    const norm = normalizeAttribute(raw.neckType, NECK_TYPES);
    if (norm) result.neckType = norm;
  }
  if (raw.sleeveLength) {
    const norm = normalizeAttribute(raw.sleeveLength, SLEEVE_LENGTHS);
    if (norm) result.sleeveLength = norm;
  }
  if (raw.pattern) {
    const norm = normalizeAttribute(raw.pattern, PATTERNS);
    if (norm) result.pattern = norm;
  }
  if (raw.occasion) {
    const norm = normalizeAttribute(raw.occasion, OCCASIONS);
    if (norm) result.occasion = norm;
  }
  if (typeof raw.blousePiece === "boolean") {
    result.blousePiece = raw.blousePiece;
  } else if (typeof raw.blousePiece === "string") {
    if (/yes|true|with/i.test(raw.blousePiece)) result.blousePiece = true;
    else if (/no|false|without/i.test(raw.blousePiece)) result.blousePiece = false;
  }
  if (typeof raw.sareeLength === "string" && raw.sareeLength.trim()) {
    const match = raw.sareeLength.match(/(\d(?:\.\d)?)\s*m(?:etre)?s?/i);
    result.sareeLength = match ? `${match[1]} metres` : raw.sareeLength.trim();
  }

  return result;
}

// A real vision model's text response may be direct JSON or wrapped in markdown code fences.
// If we can confidently extract and validate a JSON object shaped like
// ExtractedAttributes, return normalized data so the caller gets high confidence.
export function parseModelResponse(responseText: string): ExtractedAttributes | null {
  if (!responseText || typeof responseText !== "string") return null;

  // Extract from markdown code fences ```json ... ``` or first { ... } block
  const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonCandidate = codeBlockMatch ? codeBlockMatch[1] : responseText;
  const match = jsonCandidate.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;

    const parsedResult = rawModelAttributesSchema.safeParse(parsed);
    if (!parsedResult.success) return null;

    const normalized = normalizeExtractedAttributes(parsedResult.data as Record<string, unknown>);
    return Object.keys(normalized).length > 0 ? normalized : null;
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

  // Colour and fabric are only attached as SUPPORTING attributes once we've
  // confirmed this is actually a garment (at least one structural attribute
  // above was found). On their own, colour/fabric words appear in non-clothing
  // images too (e.g. "a green puzzle piece"), so emitting them alone would risk
  // fabricating an attribute — the fail-safe forbids that.
  if (Object.keys(attributes).length > 0) {
    for (const [re, label] of COLOR_PATTERNS) {
      if (re.test(lower)) {
        attributes.color = label;
        break;
      }
    }
    for (const [re, label] of FABRIC_PATTERNS) {
      if (re.test(lower)) {
        attributes.fabric = label;
        break;
      }
    }
  }

  return Object.keys(attributes).length > 0 ? attributes : null;
}
