import { SELECTOR_CONFIGS, type MeeshoConfigId, type MeeshoSelectorMap } from "@neo/adapter-meesho";

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

/**
 * Fills the active tab's Meesho Add-Product form with `values`, using the
 * selector map for `configId` (fixture for the local demo page, live for the
 * real Meesho Supplier Panel — see @neo/adapter-meesho selector configs).
 *
 * Safety: this focuses the submit control but NEVER clicks it. No auto-submit,
 * ever — the seller always reviews and clicks submit themselves.
 */
export async function sendFill(
  values: FillValues,
  configId: MeeshoConfigId,
): Promise<FillResult> {
  const selectorMap = SELECTOR_CONFIGS[configId];
  const chrome = (globalThis as { chrome?: any }).chrome;

  if (!chrome?.tabs?.query || !chrome?.scripting?.executeScript) {
    return { ok: false, error: "chrome.scripting/tabs APIs unavailable" };
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs?.[0]?.id;
    if (!tabId) {
      return { ok: false, error: "No active tab found" };
    }

    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: fillForm,
      args: [selectorMap, values],
    });

    const result = injection?.result as
      | { filled: string[]; missing: string[]; submitFocused: boolean }
      | undefined;

    if (!result) {
      return { ok: false, error: "No result returned from injected script" };
    }

    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Runs INSIDE the target page via chrome.scripting.executeScript. Must be
 * self-contained (no closed-over imports — the function is serialized and
 * re-parsed in the page context, so it cannot reference anything outside
 * its own body/args).
 *
 * Fills title/description/hsnCode/sellingPrice one at a time, human-paced
 * (~120ms apart), dispatching input+change events so React/other frameworks
 * pick up the change. Finally focuses (but never clicks) the submit control.
 */
async function fillForm(
  map: MeeshoSelectorMap,
  vals: { title: string; description: string; hsnCode: string; sellingPrice: string },
): Promise<{ filled: string[]; missing: string[]; submitFocused: boolean }> {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
    const proto = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    const setter = descriptor?.set;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const fieldOrder: Array<[keyof typeof vals, string]> = [
    ["title", map.title],
    ["description", map.description],
    ["hsnCode", map.hsnCode],
    ["sellingPrice", map.sellingPrice],
  ];

  const filled: string[] = [];
  const missing: string[] = [];

  for (const [key, selector] of fieldOrder) {
    const el = document.querySelector(selector) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | null;
    if (!el) {
      missing.push(key);
      continue;
    }
    el.focus();
    setNativeValue(el, vals[key]);
    filled.push(key);
    await sleep(120);
  }

  let submitFocused = false;
  const submitEl = document.querySelector(map.submit) as HTMLElement | null;
  if (submitEl) {
    submitEl.focus();
    submitFocused = true;
  } else {
    missing.push("submit");
  }

  return { filled, missing, submitFocused };
}
