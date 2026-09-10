import type { MeeshoConfigId } from "@neo/adapter-meesho";
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

const NO_RECEIVER_HINT =
  "Open your Meesho Add-Product page in a tab, then click Autofill.";

const TARGET_URL_PATTERN = /^https?:\/\/([^/]*\.)?meesho\.com\//i;

/**
 * Sends a fill request to the declarative content script (see
 * `entrypoints/content.ts`) running on the target tab, via
 * `chrome.tabs.sendMessage`.
 */
export async function sendFill(
  values: FillValues,
  configId: MeeshoConfigId,
  fields?: Record<string, string>,
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
      type: "NEO_FILL",
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

    return { ok: false, error: NO_RECEIVER_HINT };
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

export async function inspectTemplate(
  templateBase64: string,
  templateName: string,
  templateType: string,
): Promise<TemplateSchema> {
  const chrome = (globalThis as { chrome?: any }).chrome;
  const tabId = chrome && (await activeMeeshoTabId(chrome));
  if (!tabId) throw new Error(NO_RECEIVER_HINT);
  const result: any = await new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: "PROJECT_NEO_INSPECT_MEESHO_TEMPLATE", templateBase64, templateName, templateType },
      (r: unknown) => {
        void chrome.runtime?.lastError;
        resolve(r);
      },
    );
  });
  if (!result?.success) throw new Error(result?.error || "Could not read the Meesho template.");
  return result.schema as TemplateSchema;
}
