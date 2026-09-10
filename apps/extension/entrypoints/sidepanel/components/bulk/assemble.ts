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
