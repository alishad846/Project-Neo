import type { MeeshoConfigId } from "@neo/adapter-meesho";

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

const NO_RECEIVER_HINT =
  "Open your Meesho Add-Product page in a tab, then click Autofill.";

const TARGET_URL_PATTERN = /^https?:\/\/([^/]*\.)?meesho\.com\//i;

/**
 * Sends a fill request to the declarative content script (see
 * `entrypoints/content.ts`) running on the target tab, via
 * `chrome.tabs.sendMessage`. The content script itself performs the DOM
 * writes and focuses (never clicks) the submit control.
 *
 * Tab selection: prefer a tab whose URL matches Meesho/localhost/127.0.0.1
 * (the demo or live target) over whatever tab happens to be active, since
 * the side panel itself lives in a different "tab" context.
 */
export async function sendFill(
  values: FillValues,
  configId: MeeshoConfigId,
  // Live Meesho: a map of Meesho field `name` -> value, filled generically by
  // the content script (category-agnostic). When omitted, the content script
  // uses the fixed fixture selector map instead.
  fields?: Record<string, string>,
): Promise<FillResult> {
  const chrome = (globalThis as { chrome?: any }).chrome;

  if (!chrome?.tabs?.query || !chrome?.tabs?.sendMessage) {
    return { ok: false, error: "chrome.tabs APIs unavailable" };
  }

  try {
    const allTabs: Array<{ id?: number; url?: string; active?: boolean; windowId?: number }> =
      await chrome.tabs.query({});
    const targetTab = allTabs.find((t) => t.url && TARGET_URL_PATTERN.test(t.url));

    let tabId = targetTab?.id;
    if (!tabId) {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = activeTabs?.[0]?.id;
    }

    if (!tabId) {
      return { ok: false, error: NO_RECEIVER_HINT };
    }

    const result = await new Promise<FillResult>((resolve) => {
      chrome.tabs.sendMessage(
        tabId,
        { type: "NEO_FILL", config: configId, values, ...(fields ? { fields } : {}) },
        (response: FillResult | undefined) => {
          const lastError = chrome.runtime?.lastError;
          if (lastError || !response) {
            resolve({ ok: false, error: NO_RECEIVER_HINT });
            return;
          }
          resolve(response);
        },
      );
    });

    return result;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
