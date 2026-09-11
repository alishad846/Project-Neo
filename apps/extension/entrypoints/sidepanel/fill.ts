import type { MarketplaceId } from "@neo/adapter";
import type { MeeshoConfigId } from "@neo/adapter-meesho";
<<<<<<< HEAD
import type { AmazonConfigId } from "@neo/adapter-amazon";
import type { FlipkartConfigId } from "@neo/adapter-flipkart";
=======
import type { TemplateSchema } from "./components/bulk/types";
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9

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

// ---------------------------------------------------------------------------
// Marketplace URL patterns — used to auto-detect which marketplace the seller
// tab is on and route the fill message to the correct adapter.
// ---------------------------------------------------------------------------
const MARKETPLACE_PATTERNS: Record<MarketplaceId, RegExp> = {
  meesho: /^https?:\/\/([^/]*\.)?meesho\.com\//i,
  amazon_in: /^https?:\/\/([^/]*\.)?sellercentral\.amazon\.(in|com)\//i,
  flipkart: /^https?:\/\/([^/]*\.)?seller\.flipkart\.com\//i,
};

type ConfigId = MeeshoConfigId | AmazonConfigId | FlipkartConfigId;

function detectMarketplaceFromUrl(url: string): MarketplaceId | null {
  for (const [id, pattern] of Object.entries(MARKETPLACE_PATTERNS)) {
    if (pattern.test(url)) return id as MarketplaceId;
  }
  return null;
}

const NO_RECEIVER_HINTS: Record<MarketplaceId, string> = {
  meesho: "Open your Meesho Add-Product page in a tab, then click Autofill.",
  amazon_in: "Open your Amazon Seller Central Add-Product page in a tab, then click Autofill.",
  flipkart: "Open your Flipkart Seller Hub listing page in a tab, then click Autofill.",
};

/**
 * Sends a fill request to the declarative content script (see
 * `entrypoints/content.ts`) running on the target tab, via
<<<<<<< HEAD
 * `chrome.tabs.sendMessage`. The content script itself performs the DOM
 * writes and focuses (never clicks) the submit control.
 *
 * Tab selection: prefer a tab whose URL matches the target marketplace
 * (Meesho/Amazon/Flipkart or localhost) over whatever tab happens to be
 * active, since the side panel itself lives in a different "tab" context.
 *
 * Marketplace auto-detection: if no explicit marketplace is passed, the
 * function detects it from the target tab's URL. Falls back to "meesho"
 * for backward compatibility.
 */
export async function sendFill(
  values: FillValues,
  configId: ConfigId = "live",
  // Live marketplace: a map of marketplace field `name` -> value, filled
  // generically by the content script (category-agnostic). When omitted,
  // the content script uses the fixed fixture selector map instead.
=======
 * `chrome.tabs.sendMessage`.
 */
export async function sendFill(
  values: FillValues,
  configId: MeeshoConfigId,
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9
  fields?: Record<string, string>,
  // Explicit marketplace override. When omitted, auto-detected from tab URL.
  marketplace?: MarketplaceId,
): Promise<FillResult> {
  const chrome = (globalThis as { chrome?: any }).chrome;

  if (!chrome?.tabs?.query || !chrome?.tabs?.sendMessage) {
    return { ok: false, error: "chrome.tabs APIs unavailable" };
  }

  try {
<<<<<<< HEAD
    const allTabs: Array<{ id?: number; url?: string; active?: boolean; windowId?: number }> =
      await chrome.tabs.query({});

    // Find a tab matching ANY of the supported marketplaces.
    const targetTab = allTabs.find((t) => {
      if (!t.url) return false;
      return Object.values(MARKETPLACE_PATTERNS).some((p) => p.test(t.url!));
    });

    let tabId = targetTab?.id;
    const detectedMarketplace = targetTab?.url
      ? detectMarketplaceFromUrl(targetTab.url)
      : null;
=======
    const allTabs: Array<{
      id?: number;
      url?: string;
      active?: boolean;
      windowId?: number;
    }> = await chrome.tabs.query({});

    const targetTab = allTabs.find(
      (t) => t.url && TARGET_URL_PATTERN.test(t.url),
    );

    let tabId = targetTab?.id;
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9

    if (!tabId) {
      const activeTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      tabId = activeTabs?.[0]?.id;
    }

    if (!tabId) {
      const mp = marketplace ?? detectedMarketplace ?? "meesho";
      return { ok: false, error: NO_RECEIVER_HINTS[mp] };
    }

<<<<<<< HEAD
    const mp = marketplace ?? detectedMarketplace ?? "meesho";
    const message = {
      type: "NEO_FILL",
      marketplace: mp,
=======
    const message = {
      type: "NEO_FILL",
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9
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
