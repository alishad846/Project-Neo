import type { MarketplaceId } from "@neo/adapter";
import type { MeeshoConfigId } from "@neo/adapter-meesho";
import type { AmazonConfigId } from "@neo/adapter-amazon";
import type { FlipkartConfigId } from "@neo/adapter-flipkart";
import type { TemplateSchema } from "./components/bulk/types";

export interface FillValues {
  title: string;
  description: string;
  hsnCode: string;
  sellingPrice: string;
}

export interface FillResult {
  ok: boolean;
  error?: string;
  filled?: string[];
  missing?: string[];
  /** Fields not present on this step (empty selector) — skipped silently. */
  skipped?: string[];
  /** True if the seller pressed STOP AUTOFILL mid-run. */
  stopped?: boolean;
  submitFocused?: boolean;
}

const NO_RECEIVER_HINTS: Record<MarketplaceId, string> = {
  meesho: "Open your Meesho Add-Product page in a tab, then click Autofill.",
  amazon_in: "Open your Amazon Seller Central Add-Product page in a tab, then click Autofill.",
  flipkart: "Open your Flipkart Seller Hub listing page in a tab, then click Autofill.",
};

// Keep the default hint for Meesho-only callers (sendMeeshoAutofill, etc.)
const NO_RECEIVER_HINT = NO_RECEIVER_HINTS.meesho;

export const MARKETPLACE_PATTERNS: Record<MarketplaceId, RegExp> = {
  meesho: /^https?:\/\/([^/]*\.)?meesho\.com\//i,
  amazon_in: /^https?:\/\/([^/]*\.)?sellercentral\.amazon\.(in|com)\//i,
  flipkart: /^https?:\/\/([^/]*\.)?seller\.flipkart\.com\//i,
};

// Legacy alias — used by sendMeeshoAutofill and helpers that only care about Meesho.
const TARGET_URL_PATTERN = MARKETPLACE_PATTERNS.meesho;

export type ConfigId = MeeshoConfigId | AmazonConfigId | FlipkartConfigId;

export function detectMarketplaceFromUrl(url: string): MarketplaceId | null {
  for (const [id, pattern] of Object.entries(MARKETPLACE_PATTERNS)) {
    if (pattern.test(url)) return id as MarketplaceId;
  }
  return null;
}

/**
 * Sends a fill request to the declarative content script (see
 * `entrypoints/content.ts`) running on the target tab, via
 * `chrome.tabs.sendMessage`. Detects the marketplace from the tab URL
 * and tags the message so the content script routes to the right adapter.
 */
export async function sendFill(
  values: FillValues,
  configId: ConfigId = "live",
  fields?: Record<string, string>,
  marketplace?: MarketplaceId,
): Promise<FillResult> {
  const chrome = (globalThis as { chrome?: any }).chrome;

  if (!chrome?.tabs?.query || !chrome?.tabs?.sendMessage) {
    return { ok: false, error: "chrome.tabs APIs unavailable" };
  }

  try {
    const allTabs: Array<{
      id?: number;
      url?: string;
      active?: boolean;
      windowId?: number;
    }> = await chrome.tabs.query({});

    // Find a tab matching ANY supported marketplace (not just Meesho).
    const targetTab = allTabs.find((t) => {
      if (!t.url) return false;
      return Object.values(MARKETPLACE_PATTERNS).some((p) => p.test(t.url!));
    });

    const detectedMarketplace = targetTab?.url
      ? detectMarketplaceFromUrl(targetTab.url)
      : null;

    let tabId = targetTab?.id;

    if (!tabId) {
      const activeTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      tabId = activeTabs?.[0]?.id;
    }

    const mp = marketplace ?? detectedMarketplace ?? "meesho";

    if (!tabId) {
      return { ok: false, error: NO_RECEIVER_HINTS[mp] };
    }

    const message = {
      type: "NEO_FILL",
      marketplace: mp,
      config: configId,
      values,
      ...(fields ? { fields } : {}),
    };

    const trySend = () =>
      new Promise<FillResult | null>((resolve) => {
        chrome.tabs.sendMessage(
          tabId,
          message,
          (response: FillResult | undefined) => {
            const lastError = chrome.runtime?.lastError;

            if (lastError || !response) {
              resolve(null);
              return;
            }

            resolve(response);
          },
        );
      });

    let result = await trySend();

    if (result) return result;

    if (chrome.scripting?.executeScript) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content-scripts/content.js"],
        });

        await new Promise((r) => setTimeout(r, 300));

        result = await trySend();

        if (result) return result;
      } catch {
        // Fall through to the receiver hint.
      }
    }

    return { ok: false, error: NO_RECEIVER_HINTS[mp] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Unified autofill dispatcher. Auto-detects the target tab's marketplace:
 * - On Meesho: delegates to the team's `sendMeeshoAutofill` engine.
 * - On Amazon: maps the product data to Amazon fields and fills using the React bypass.
 * - On Flipkart: maps the product data to Flipkart fields and fills using the Angular dispatcher.
 */
export async function sendAutofill(
  product: Record<string, unknown>,
): Promise<FillResult> {
  const chrome = (globalThis as { chrome?: any }).chrome;
  if (!chrome?.tabs?.query) {
    return sendMeeshoAutofill(product);
  }

  const allTabs: Array<{ id?: number; url?: string; active?: boolean }> =
    await chrome.tabs.query({});
  const targetTab =
    allTabs.find((t) => {
      if (!t.url) return false;
      return Object.values(MARKETPLACE_PATTERNS).some((p) => p.test(t.url!));
    }) ?? (await chrome.tabs.query({ active: true, currentWindow: true }))?.[0];

  const mp = targetTab?.url ? detectMarketplaceFromUrl(targetTab.url) : "meesho";

  if (mp === "amazon_in") {
    const attrs = (product.attributes as Record<string, unknown> | undefined) ?? {};
    const title = String(product.title ?? product.product_name ?? product.productName ?? "");
    const description = String(product.description ?? attrs.description ?? "");
    const sellingPrice = String(product.sellingPrice ?? attrs.sellingPrice ?? attrs.meesho_price ?? "");
    const mrp = String(product.mrp ?? attrs.mrp ?? sellingPrice);
    const hsnCode = String(product.hsnCode ?? attrs.hsn_id ?? attrs.hsn_code ?? "");
    const brand = String(product.brand ?? attrs.brand ?? "");
    const sku = String(product.sku ?? attrs.sku ?? "");

    const values: FillValues = {
      title,
      description,
      hsnCode,
      sellingPrice,
    };

    const fields: Record<string, string> = {
      item_name: title,
      product_name: title,
      productName: title,
      product_description: description,
      description,
      brand_name: brand,
      brand,
      standard_price: sellingPrice,
      sellingPrice,
      list_price: mrp,
      mrp,
      hsn_code: hsnCode,
      hsnCode,
      item_sku: sku,
      skuId: sku,
      bullet_point1: String(attrs.bullet_point1 ?? (attrs.fabric ? `Fabric: ${attrs.fabric}` : "")),
      bullet_point2: String(attrs.bullet_point2 ?? (attrs.occasion ? `Occasion: ${attrs.occasion}` : "")),
      bullet_point3: String(attrs.bullet_point3 ?? (attrs.color ? `Color: ${attrs.color}` : "")),
      generic_keywords: String(attrs.keywords ?? product.category ?? ""),
      searchKeywords: String(attrs.keywords ?? product.category ?? ""),
    };

    // Forward any extra string attributes
    for (const [k, v] of Object.entries(attrs)) {
      if (typeof v === "string" && v && !fields[k]) {
        fields[k] = v;
      }
    }

    return sendFill(values, "live", fields, "amazon_in");
  }

  if (mp === "flipkart") {
    const attrs = (product.attributes as Record<string, unknown> | undefined) ?? {};
    const title = String(product.title ?? product.product_name ?? product.productName ?? "");
    const description = String(product.description ?? attrs.description ?? "");
    const sellingPrice = String(product.sellingPrice ?? attrs.sellingPrice ?? attrs.meesho_price ?? "");
    const mrp = String(product.mrp ?? attrs.mrp ?? sellingPrice);
    const hsnCode = String(product.hsnCode ?? attrs.hsn_id ?? attrs.hsn_code ?? "");
    const brand = String(product.brand ?? attrs.brand ?? "");
    const sku = String(product.sku ?? attrs.sku ?? "");

    const values: FillValues = {
      title,
      description,
      hsnCode,
      sellingPrice,
    };

    const fields: Record<string, string> = {
      product_name: title,
      productName: title,
      description,
      brand,
      selling_price: sellingPrice,
      sellingPrice,
      mrp,
      hsn: hsnCode,
      hsnCode,
      sku_id: sku,
      skuId: sku,
      procurement_sla: "3",
      procurementSla: "3",
      stock: String(attrs.inventory ?? "10"),
      stockCount: String(attrs.inventory ?? "10"),
      shipping_days: "2",
      shippingDays: "2",
    };

    return sendFill(values, "live", fields, "flipkart");
  }

  // Default: Meesho full engine
  return sendMeeshoAutofill(product);
}

export async function sendMeeshoAutofill(
  product: Record<string, unknown>,
): Promise<FillResult> {
  const chrome = (globalThis as { chrome?: any }).chrome;

  if (!chrome?.tabs?.query || !chrome?.tabs?.sendMessage) {
    return { ok: false, error: "chrome.tabs APIs unavailable" };
  }

  try {
    const allTabs: Array<{
      id?: number;
      url?: string;
    }> = await chrome.tabs.query({});

    const targetTab = allTabs.find(
      (t) => t.url && TARGET_URL_PATTERN.test(t.url),
    );

    let tabId = targetTab?.id;

    if (!tabId) {
      const activeTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      tabId = activeTabs?.[0]?.id;
    }

    if (!tabId) {
      return { ok: false, error: NO_RECEIVER_HINT };
    }

    const message = {
      type: "NEO_MEESHO_AUTOFILL",
      product,
    };

    const trySend = () =>
      new Promise<FillResult | null>((resolve) => {
        chrome.tabs.sendMessage(
          tabId,
          message,
          (response: FillResult | undefined) => {
            const lastError = chrome.runtime?.lastError;

            if (lastError || !response) {
              resolve(null);
              return;
            }

            resolve(response);
          },
        );
      });

    let result = await trySend();

    if (result) {
      return result;
    }

    if (chrome.scripting?.executeScript) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content-scripts/content.js"],
        });

        await new Promise((r) => setTimeout(r, 300));

        result = await trySend();

        if (result) {
          return result;
        }
      } catch {
        // Fall through to the receiver hint.
      }
    }

    return { ok: false, error: NO_RECEIVER_HINT };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function activeMeeshoTabId(chrome: any): Promise<number | null> {
  const allTabs = await chrome.tabs.query({});
  const target = allTabs.find((t: any) => t.url && TARGET_URL_PATTERN.test(t.url));
  if (target?.id) return target.id;
  const active = await chrome.tabs.query({ active: true, currentWindow: true });
  return active?.[0]?.id ?? null;
}

// Sends a message to the Meesho tab's content script and returns its response.
// If there's no receiver (the tab was open before the extension loaded, so the
// declarative content script never ran there), it injects the content script
// once and retries — the same resilience the autofill senders (sendFill /
// sendMeeshoAutofill) already have. Returns null only if there's genuinely no
// receiver even after injection.
async function sendToMeeshoTab<T>(chrome: any, tabId: number, message: unknown): Promise<T | null> {
  const trySend = () =>
    new Promise<T | null>((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response: T | undefined) => {
        const lastError = chrome.runtime?.lastError;
        if (lastError || response === undefined) {
          resolve(null);
          return;
        }
        resolve(response);
      });
    });

  let result = await trySend();
  if (result !== null) return result;

  if (chrome.scripting?.executeScript) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content-scripts/content.js"],
      });
      await new Promise((r) => setTimeout(r, 300));
      result = await trySend();
      if (result !== null) return result;
    } catch {
      // fall through — genuinely no receiver
    }
  }

  return null;
}

export async function inspectTemplate(
  templateBase64: string,
  templateName: string,
  templateType: string,
): Promise<TemplateSchema> {
  const chrome = (globalThis as { chrome?: any }).chrome;
  const tabId = chrome && (await activeMeeshoTabId(chrome));
  if (!tabId) throw new Error(NO_RECEIVER_HINT);
  const result = await sendToMeeshoTab<{ success: boolean; schema?: TemplateSchema; error?: string }>(
    chrome,
    tabId,
    { type: "PROJECT_NEO_INSPECT_MEESHO_TEMPLATE", templateBase64, templateName, templateType },
  );
  if (result === null) throw new Error(NO_RECEIVER_HINT);
  if (!result.success) throw new Error(result.error || "Could not read the Meesho template.");
  return result.schema as TemplateSchema;
}

export interface BulkGenerateResponse {
  success: boolean; filename?: string; rows?: number;
  validationProblems?: Array<{ row: number; field: string; error: string; value?: unknown }>;
  blobBytes?: ArrayBuffer; blobType?: string; error?: string;
}

export async function generateBulk(
  templateBase64: string, templateName: string, templateType: string, products: unknown[],
): Promise<BulkGenerateResponse> {
  const chrome = (globalThis as { chrome?: any }).chrome;
  const tabId = chrome && (await activeMeeshoTabId(chrome));
  if (!tabId) throw new Error(NO_RECEIVER_HINT);
  const result = await sendToMeeshoTab<BulkGenerateResponse>(
    chrome,
    tabId,
    { type: "PROJECT_NEO_GENERATE_MEESHO_BULK", templateBase64, templateName, templateType, products },
  );
  if (result === null) throw new Error(NO_RECEIVER_HINT);
  return result;
}
