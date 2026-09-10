import type { MarketplaceId } from "@neo/adapter";
import type { MeeshoConfigId } from "@neo/adapter-meesho";
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

type ConfigId = MeeshoConfigId | FlipkartConfigId;

const MARKETPLACE_PATTERNS: Record<MarketplaceId, RegExp> = {
  meesho: /^https?:\/\/([^/]*\.)?meesho\.com\//i,
  amazon_in: /^https?:\/\/([^/]*\.)?sellercentral\.amazon\.(in|com)\//i,
  flipkart: /^https?:\/\/([^/]*\.)?seller\.flipkart\.com\//i,
};

const NO_RECEIVER_HINTS: Record<MarketplaceId, string> = {
  meesho: "Open your Meesho Add-Product page in a tab, then click Autofill.",
  amazon_in:
    "Open your Amazon Seller Central Add-Product page in a tab, then click Autofill.",
  flipkart:
    "Open your Flipkart Seller Hub listing page in a tab, then click Autofill.",
};

function detectMarketplaceFromUrl(url: string): MarketplaceId | null {
  for (const [marketplace, pattern] of Object.entries(MARKETPLACE_PATTERNS)) {
    if (pattern.test(url)) {
      return marketplace as MarketplaceId;
    }
  }

  return null;
}

/**
 * Sends a generic fill request to the content script.
 * Supports Meesho and Flipkart marketplace routing.
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

    const targetTab = allTabs.find((t) => {
  if (!t.url) return false;

  if (marketplace) {
    return MARKETPLACE_PATTERNS[marketplace].test(t.url);
  }

  return Object.values(MARKETPLACE_PATTERNS).some((pattern) =>
    pattern.test(t.url!),
  );
});

    let tabId = targetTab?.id;

    const detectedMarketplace = targetTab?.url
      ? detectMarketplaceFromUrl(targetTab.url)
      : null;

    if (!tabId) {
      const activeTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      tabId = activeTabs?.[0]?.id;
    }

    const selectedMarketplace =
      marketplace ?? detectedMarketplace ?? "meesho";

    if (!tabId) {
      return {
        ok: false,
        error: NO_RECEIVER_HINTS[selectedMarketplace],
      };
    }

    const message = {
      type: "NEO_FILL",
      marketplace: selectedMarketplace,
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
        // Fall through to marketplace-specific receiver hint.
      }
    }

    return {
      ok: false,
      error: NO_RECEIVER_HINTS[selectedMarketplace],
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Existing Meesho-specific autofill.
 * Kept for compatibility with AIAutofill.tsx.
 */
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
      (t) => t.url && MARKETPLACE_PATTERNS.meesho.test(t.url),
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
      return {
        ok: false,
        error: NO_RECEIVER_HINTS.meesho,
      };
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
        // Fall through to receiver hint.
      }
    }

    return {
      ok: false,
      error: NO_RECEIVER_HINTS.meesho,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}