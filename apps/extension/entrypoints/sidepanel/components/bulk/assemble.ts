import type {
  AssembledProduct, SkuDraft, TemplateColumn, TemplateSchema, VariantRow,
} from "./types";

// Field keys that are per-variant, not shared, so they never leak into the
// shared-field form or its attributes.
const VARIANT_FIELDS = new Set([
  "variation", "size", "color", "colour", "length",
  "meesho_price", "price", "mrp", "inventory", "stock", "quantity",
  "wrong_defective_returns_price",
]);

// Synonyms for the attributes the vision model emits, so extracted values map
// onto whatever the seller's template actually calls each field. Each group's
// members are compared normalized (lowercase, alphanumeric-only).
const ATTR_SYNONYMS: string[][] = [
  ["color", "colour", "color_family", "colour_family"],
  ["fabric", "material", "material_type"],
  ["pattern", "print_or_pattern_type", "print_pattern_type", "print_type", "print"],
  ["neck", "neck_type", "neckline", "neck_style", "necktype"],
  ["sleeve_length", "sleeve", "sleeve_type", "sleevelength"],
  ["occasion", "occasion_type"],
  ["fit_shape", "fit", "shape", "fit_type"],
  ["length", "product_length"],
  ["hemline"],
];

function normKey(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Every normalized alias for a key, via the synonym groups above.
function aliasesFor(key: string): Set<string> {
  const n = normKey(key);
  const out = new Set<string>([n]);
  for (const group of ATTR_SYNONYMS) {
    if (group.some((g) => normKey(g) === n)) group.forEach((g) => out.add(normKey(g)));
  }
  return out;
}

// Maps the vision model's raw attribute keys onto the template's ACTUAL field
// names, so prefill lands in the right form fields regardless of what the
// template calls them (e.g. model "neckType" → template "neck", model
// "sleeveLength" → template "sleeve_length"). Only keys that match a real
// template column are kept; unmatched extractions are dropped rather than
// creating phantom fields. Pure + testable.
export function mapPrefillToSchema(
  rawAttributes: Record<string, unknown>,
  schema: TemplateSchema,
): Record<string, string> {
  const prefill: Record<string, string> = {};
  for (const [rawKey, rawValue] of Object.entries(rawAttributes)) {
    if (rawValue == null || rawValue === "") continue;
    const wanted = aliasesFor(rawKey);
    const column = schema.columns.find(
      (c) => wanted.has(normKey(c.field)) || wanted.has(normKey(c.header)),
    );
    if (column) prefill[column.field] = String(rawValue);
  }
  return prefill;
}

// Extracts image URLs from arbitrary pasted text. Handles links separated by
// newlines/spaces/commas AND links pasted back-to-back with no separator
// (e.g. "https://a/x.jpghttps://b/y.jpg" → two links) by splitting at each
// `http(s)://` boundary. De-duplicates, preserving first-seen order.
export function parseImageLinks(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s]*?(?=https?:\/\/|\s|$)/gi) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of matches) {
    const url = raw.trim().replace(/[.,;]+$/, "");
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

export function newVariantRow(): VariantRow {
  return {
    id: `v-${Math.random().toString(36).slice(2)}`,
    variation: "", color: "", length: "",
    meesho_price: "", mrp: "", inventory: "",
    wrong_defective_returns_price: "", measurements: {},
  };
}

// Turns a SkuDraft into the object the engine's buildRows() consumes. The engine
// reads its fixed row keys from the product top level (via getValue alias lists)
// and merges product.attributes for any other template column, so we place the
// shared fields BOTH at top level and in attributes — duplicates are harmless.
// The image link is attached once at product level; the engine repeats it onto
// every variant row.
export function assembleProduct(sku: SkuDraft, groupIndex: number): AssembledProduct {
  const shared = sku.shared;
  const groupId = (shared.group_id ?? "").trim() || `PN-G${groupIndex + 1}`;

  const variants = sku.variants.map((v) => ({
    variation: v.variation,
    color: v.color,
    meesho_price: v.meesho_price,
    mrp: v.mrp,
    inventory: v.inventory,
    wrong_defective_returns_price: v.wrong_defective_returns_price,
    ...(v.length ? { length: v.length } : {}),
    ...v.measurements,
    attributes: { ...(v.length ? { length: v.length } : {}), ...v.measurements },
  }));

  return {
    ...shared,
    group_id: groupId,
    images: sku.imageUrl ? [sku.imageUrl] : [],
    attributes: { ...shared },
    variants,
  };
}

// Copies only the shared fields whose "same as previous" toggle is on.
export function applySameAsPrevious(current: SkuDraft, previous: SkuDraft | null): SkuDraft {
  if (!previous) return current;
  const shared = { ...current.shared };
  for (const [field, on] of Object.entries(current.sameAsPrev)) {
    if (on && previous.shared[field] !== undefined) {
      shared[field] = previous.shared[field];
    }
  }
  return { ...current, shared };
}

// An optional group is all-or-nothing: complete (all filled), empty (none), or
// partial (some) — partial blocks generation.
export function optionalGroupStatus(
  sharedValues: Record<string, string>,
  columns: TemplateColumn[],
): "complete" | "empty" | "partial" {
  const filled = columns.filter((c) => (sharedValues[c.field] ?? "").trim() !== "").length;
  if (filled === 0) return "empty";
  if (filled === columns.length) return "complete";
  return "partial";
}

function optionsFor(schema: TemplateSchema, fields: string[]): string[] {
  const col = schema.columns.find((c) => fields.includes(c.field));
  return col ? col.allowedValues : [];
}

export function deriveVariantAxes(schema: TemplateSchema): {
  sizeOptions: string[]; colourOptions: string[]; lengthOptions: string[];
} {
  return {
    sizeOptions: optionsFor(schema, ["variation", "size"]),
    colourOptions: optionsFor(schema, ["color", "colour"]),
    lengthOptions: optionsFor(schema, ["length"]),
  };
}

// True if a template column is a shared (product-level) field, i.e. not a
// per-variant field and not a system/image column.
export function isSharedColumn(column: TemplateColumn): boolean {
  if (column.system) return false;
  if (VARIANT_FIELDS.has(column.field)) return false;
  if (column.field.startsWith("image")) return false;
  return true;
}
