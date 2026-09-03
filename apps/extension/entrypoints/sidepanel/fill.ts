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
  submitFocused?: boolean;
}

const NO_RECEIVER_HINT =
  "Open your Meesho Add-Product page — or the Neo demo form at localhost:4173/demo — in a tab, then click Autofill.";

const TARGET_URL_PATTERN = /^https?:\/\/([^/]*\.)?(meesho\.com|localhost|127\.0\.0\.1)(:\d+)?\//i;

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
        { type: "NEO_FILL", config: configId, values },
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
