import type { ProductGenome } from "@neo/genome";

const API_URL = "http://localhost:3000";

export async function getProducts(): Promise<ProductGenome[]> {
  const res = await fetch(`${API_URL}/products`);
  if (!res.ok) throw new Error(`Product API error: ${res.status}`);
  return res.json();
}

export interface PricingRule {
  actionType: "PERCENTAGE_DISCOUNT" | "FLAT_DISCOUNT" | "SET_FIXED" | "TARGET_MARGIN";
  actionValue: number;
  floorPrice?: number;
  roundTo99?: boolean;
}

export interface SkuDiff {
  sku: string;
  currentPrice: number;
  proposedPrice: number;
  currentMargin: number;
  proposedMargin: number;
  breakeven: number;
  floorApplied: boolean;
  belowBreakeven: boolean;
}

export interface DryRunResult {
  ruleSummary: string;
  totalSkus: number;
  totalMarginDelta: number;
  diffs: SkuDiff[];
}

export async function dryRunPricing(rule: PricingRule): Promise<DryRunResult> {
  const res = await fetch(`${API_URL}/pricing/dry-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  if (!res.ok) throw new Error(`Dry-run error: ${res.status}`);
  return res.json();
}

export async function applyPricing(rule: PricingRule): Promise<{ txnId: number; updated: number }> {
  const res = await fetch(`${API_URL}/pricing/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rule }),
  });
  if (!res.ok) throw new Error(`Apply error: ${res.status}`);
  return res.json();
}

export async function undoPricing(txnId: number): Promise<{ restored: number }> {
  const res = await fetch(`${API_URL}/pricing/undo/${txnId}`, { method: "POST" });
  if (!res.ok) throw new Error(`Undo error: ${res.status}`);
  return res.json();
}

export interface ExtractResult {
  attributes: Record<string, unknown>;
  confidence: "low" | "medium" | "high";
  source: "heuristic" | "model";
}

export interface ValidationIssue {
  field: string;
  severity: "error" | "warning";
  message: string;
}

export interface CompiledListing {
  adapterId: string;
  categoryId: string;
  genomeVersion: number;
  fields: Record<string, unknown>;
}

export interface PublishResult {
  txnId: number;
  listing: CompiledListing;
  warnings: ValidationIssue[];
}

// Image-first extraction (production): just the photo + an optional category
// hint (the Meesho category the seller is listing under). No seeded product.
export async function extractFromImage(imageBase64: string, category?: string): Promise<ExtractResult> {
  const res = await fetch(`${API_URL}/ai/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(category ? { imageBase64, category } : { imageBase64 }),
  });
  if (!res.ok) throw new Error(`Extract error: ${res.status}`);
  return res.json();
}

export async function publishListing(
  productId: number,
  title: string,
  attributes: Record<string, unknown>,
  genomeEdits?: { hsnCode?: string; sellingPrice?: string },
): Promise<PublishResult> {
  const res = await fetch(`${API_URL}/ai/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      title,
      attributes,
      hsnCode: genomeEdits?.hsnCode,
      sellingPrice: genomeEdits?.sellingPrice,
    }),
  });
  if (!res.ok) throw new Error(`Publish error: ${res.status}`);
  return res.json();
}

export async function undoPublish(txnId: number): Promise<{ restored: number }> {
  const res = await fetch(`${API_URL}/ai/undo/${txnId}`, { method: "POST" });
  if (!res.ok) throw new Error(`Undo error: ${res.status}`);
  return res.json();
}
