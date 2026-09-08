import type { ProductGenome } from "@neo/genome";
import { clearToken, getToken } from "./auth";

const API_URL = "http://localhost:3000";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Broadcast so the AuthGate can re-lock the panel immediately on a mid-session
// 401, instead of the user being stuck on an error until they reload.
export const AUTH_EXPIRED_EVENT = "neo-auth-expired";

async function handleUnauthorized(res: Response): Promise<void> {
  if (res.status === 401) {
    await clearToken();
    if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    throw new Error("Session expired — please log in again.");
  }
}

export async function getProducts(): Promise<ProductGenome[]> {
  const res = await fetch(`${API_URL}/products`, { headers: await authHeaders() });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Product API error: ${res.status}`);
  return res.json();
}

export type ProductGenomeCreate = Omit<ProductGenome, "id" | "sellerId" | "version" | "isArchived" | "createdAt" | "updatedAt">;

export async function createProduct(body: Partial<ProductGenomeCreate>): Promise<ProductGenome> {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Create product error: ${res.status}`);
  return res.json();
}

export async function updateProductGenome(id: number, body: Partial<ProductGenomeCreate>): Promise<ProductGenome> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(body),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Update product error: ${res.status}`);
  return res.json();
}

export async function archiveProduct(id: number): Promise<ProductGenome> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
    headers: await authHeaders(),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Archive product error: ${res.status}`);
  return res.json();
}

export async function uploadProductImage(imageBase64: string, filename?: string): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/products/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(filename ? { imageBase64, filename } : { imageBase64 }),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Image upload error: ${res.status}`);
  return res.json();
}

export interface PricingRule {
  actionType: "PERCENTAGE_DISCOUNT" | "FLAT_DISCOUNT" | "SET_FIXED" | "TARGET_MARGIN";
  actionValue: number;
  floorPrice?: number;
  roundTo99?: boolean;
  floorBreakeven?: boolean;
  roundToCharm?: boolean;
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

export async function dryRunPricing(rule: PricingRule, skus?: string[]): Promise<DryRunResult> {
  const res = await fetch(`${API_URL}/pricing/dry-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(skus && skus.length > 0 ? { ...rule, skus } : rule),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Dry-run error: ${res.status}`);
  return res.json();
}

export async function applyPricing(rule: PricingRule, skus?: string[]): Promise<{ txnId: number; updated: number }> {
  const res = await fetch(`${API_URL}/pricing/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(skus && skus.length > 0 ? { rule, skus } : { rule }),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Apply error: ${res.status}`);
  return res.json();
}

export async function undoPricing(txnId: number): Promise<{ restored: number }> {
  const res = await fetch(`${API_URL}/pricing/undo/${txnId}`, {
    method: "POST",
    headers: await authHeaders(),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Undo error: ${res.status}`);
  return res.json();
}

export async function resetPrices(skus?: string[]): Promise<{ txnId: number; updated: number }> {
  const res = await fetch(`${API_URL}/pricing/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(skus && skus.length > 0 ? { skus } : {}),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Reset error: ${res.status}`);
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
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify(category ? { imageBase64, category } : { imageBase64 }),
  });
  await handleUnauthorized(res);
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
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({
      productId,
      title,
      attributes,
      hsnCode: genomeEdits?.hsnCode,
      sellingPrice: genomeEdits?.sellingPrice,
    }),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Publish error: ${res.status}`);
  return res.json();
}

export async function undoPublish(txnId: number): Promise<{ restored: number }> {
  const res = await fetch(`${API_URL}/ai/undo/${txnId}`, {
    method: "POST",
    headers: await authHeaders(),
  });
  await handleUnauthorized(res);
  if (!res.ok) throw new Error(`Undo error: ${res.status}`);
  return res.json();
}
