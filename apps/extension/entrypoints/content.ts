import { SELECTOR_CONFIGS, type MeeshoConfigId, type MeeshoSelectorMap } from "@neo/adapter-meesho";

export interface FillValues {
  title: string;
  description: string;
  hsnCode: string;
  sellingPrice: string;
}

interface FillMessage {
  type: "NEO_FILL";
  config: MeeshoConfigId;
  values: FillValues;
}

interface FillResponse {
  ok: boolean;
  filled: string[];
  missing: string[];
  submitFocused: boolean;
}

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

/**
 * Fills the current page's form using `map`, human-paced (~120ms between
 * fields) so React/other frameworks reliably pick up each change.
 *
 * Safety: focuses the submit control at the end but NEVER clicks or submits
 * it — the seller always reviews and clicks submit themselves.
 */
async function fillForm(map: MeeshoSelectorMap, vals: FillValues): Promise<FillResponse> {
  const fieldOrder: Array<[keyof FillValues, string]> = [
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

  return { ok: true, filled, missing, submitFocused };
}

export default defineContentScript({
  matches: ["*://*.meesho.com/*", "http://localhost/*", "http://127.0.0.1/*"],
  main() {
    // Readiness marker so the side panel (or a test probe) can detect that
    // the declarative content script actually injected into this page.
    (window as unknown as { __NEO_CONTENT__?: boolean }).__NEO_CONTENT__ = true;

    const chrome = (globalThis as { chrome?: any }).chrome;
    if (!chrome?.runtime?.onMessage) return;

    chrome.runtime.onMessage.addListener(
      (message: FillMessage, _sender: unknown, sendResponse: (response: FillResponse | { ok: false; error: string }) => void) => {
        if (!message || message.type !== "NEO_FILL") return false;

        const map = SELECTOR_CONFIGS[message.config];
        if (!map) {
          sendResponse({ ok: false, error: `Unknown selector config: ${message.config}` });
          return true;
        }

        fillForm(map, message.values)
          .then((result) => sendResponse(result))
          .catch((err) =>
            sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }),
          );

        return true; // keep the message channel open for the async response
      },
    );
  },
});
