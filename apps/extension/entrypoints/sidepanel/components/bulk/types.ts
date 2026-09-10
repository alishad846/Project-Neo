// Shared types for the Bulk Catalogue Wizard's pure data-shaping module.
// No browser/DOM/network dependencies — safe to import from Vitest (node env)
// and from the React sidepanel UI alike.

export interface VariantRow {
  id: string;
  variation: string;
  color: string;
  length: string;
  meesho_price: string;
  mrp: string;
  inventory: string;
  wrong_defective_returns_price: string;
  measurements: Record<string, string>;
}

export interface SkuDraft {
  id: string;
  imageUrl: string;
  prefill: Record<string, string>;
  shared: Record<string, string>;
  sameAsPrev: Record<string, boolean>;
  variants: VariantRow[];
}

export type TemplateColumnType = "required" | "optional" | "system" | "recommended";

export interface TemplateColumn {
  index: number;
  column: string;
  header: string;
  field: string;
  type: TemplateColumnType;
  required: boolean;
  system: boolean;
  recommended: boolean;
  optional: boolean;
  allowedValues: string[];
}

export interface TemplateSchema {
  version: string;
  fillSheet: string;
  validationSheet: string;
  dataStartRow: number;
  columns: TemplateColumn[];
}

export type AssembledVariant = Record<string, unknown> & {
  variation: string;
  color: string;
  meesho_price: string;
  mrp: string;
  inventory: string;
  wrong_defective_returns_price: string;
  length?: string;
  attributes: Record<string, string>;
};

export type AssembledProduct = Record<string, unknown> & {
  group_id: string;
  images: string[];
  attributes: Record<string, string>;
  variants: AssembledVariant[];
};
