import type { MarketplaceId } from "@neo/adapter";
import type { MeeshoConfigId } from "@neo/adapter-meesho";
import type { AmazonConfigId } from "@neo/adapter-amazon";
import type { FlipkartConfigId } from "@neo/adapter-flipkart";

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
  fields?: Record<string, string>,
  // Explicit marketplace override. When omitted, auto-detected from tab URL.
  marketplace?: MarketplaceId,
): Promise<FillResult> {
  const chrome = (globalThis as { chrome?: any }).chrome;

  if (!chrome?.tabs?.query || !chrome?.tabs?.sendMessage) {
    return { ok: false, error: "chrome.tabs APIs unavailable" };
  }

  try {
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

    if (!tabId) {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = activeTabs?.[0]?.id;
    }

    if (!tabId) {
      const mp = marketplace ?? detectedMarketplace ?? "meesho";
      return { ok: false, error: NO_RECEIVER_HINTS[mp] };
    }

    const mp = marketplace ?? detectedMarketplace ?? "meesho";
    const message = {
      type: "NEO_FILL",
      marketplace: mp,
      config: configId,
      values,
      ...(fields ? { fields } : {}),
    };

    const trySend = () =>
      new Promise<FillResult | null>((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response: FillResult | undefined) => {
          // Reading lastError swallows the "no receiver" console error.
          const lastError = chrome.runtime?.lastError;
          if (lastError || !response) {
            resolve(null);
            return;
          }
          resolve(response);
        });
      });

    // First attempt: talk to the declarative content script if it's there.
    let result = await trySend();
    if (result) return result;

    // No receiver — the tab was open before the extension loaded. Inject the
    // content script programmatically, then retry once.
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
        // fall through to the hint below
      }
    }

    return { ok: false, error: NO_RECEIVER_HINTS[mp] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
