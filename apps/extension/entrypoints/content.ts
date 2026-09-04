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
  skipped: string[];
  submitFocused: boolean;
  stopped: boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Human-friendly labels shown in the "✓ FILLED" badge per field.
const FIELD_LABELS: Record<keyof FillValues, string> = {
  title: "Product Name",
  description: "Description",
  hsnCode: "HSN Code",
  sellingPrice: "Selling Price",
};

// ---------------------------------------------------------------------------
// Autofill overlay UX (Neo pink). Mirrors the reference flow: each field glows
// as it fills and gets a "✓ FILLED" badge, while a floating "STOP AUTOFILL"
// button lets the seller halt at any time. All injected into the page by the
// content script; namespaced with `neo-af-` so it can't collide with the host.
// ---------------------------------------------------------------------------
const STYLE_ID = "neo-af-styles";
const STOP_BTN_ID = "neo-af-stop";
const BADGE_CLASS = "neo-af-badge";
const HIGHLIGHT_CLASS = "neo-af-highlight";

// Module-level stop flag. Set true by the STOP AUTOFILL button; the fill loop
// checks it between fields and aborts cleanly.
let stopRequested = false;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px solid #ff90e8 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(255,144,232,0.35), 0 0 14px 2px rgba(255,144,232,0.7) !important;
      border-radius: 8px !important;
      transition: box-shadow 0.2s ease, outline-color 0.2s ease !important;
    }
    .${BADGE_CLASS} {
      position: absolute;
      z-index: 2147483646;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      font: 600 12px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #000;
      background: #ff90e8;
      border: 2px solid #000;
      border-radius: 9999px;
      box-shadow: 2px 2px 0 0 #000;
      pointer-events: none;
      animation: neo-af-pop 0.18s ease-out;
    }
    @keyframes neo-af-pop {
      from { transform: scale(0.7); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    #${STOP_BTN_ID} {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483647;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      font: 700 15px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      letter-spacing: 0.5px;
      color: #000;
      background: #ff90e8;
      border: 3px solid #000;
      border-radius: 9999px;
      box-shadow: 4px 4px 0 0 #000;
      cursor: pointer;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    #${STOP_BTN_ID}:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 5px 6px 0 0 #000; }
    #${STOP_BTN_ID}:active { transform: translateX(-50%) translateY(1px); box-shadow: 1px 1px 0 0 #000; }
    #${STOP_BTN_ID} .neo-af-stopdot { width: 12px; height: 12px; background: #000; border-radius: 2px; }
    @media (prefers-reduced-motion: reduce) {
      .${BADGE_CLASS} { animation: none; }
      .${HIGHLIGHT_CLASS} { transition: none !important; }
    }
  `;
  document.head.appendChild(style);
}

function showStopButton() {
  if (document.getElementById(STOP_BTN_ID)) return;
  const btn = document.createElement("button");
  btn.id = STOP_BTN_ID;
  btn.type = "button";
  btn.innerHTML = `<span class="neo-af-stopdot"></span> STOP AUTOFILL`;
  btn.addEventListener("click", () => {
    stopRequested = true;
    btn.textContent = "STOPPING…";
  });
  document.body.appendChild(btn);
}

function removeStopButton() {
  document.getElementById(STOP_BTN_ID)?.remove();
}

function clearOverlays() {
  document.querySelectorAll(`.${BADGE_CLASS}`).forEach((n) => n.remove());
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((n) => n.classList.remove(HIGHLIGHT_CLASS));
}

// Place a "✓ FILLED" badge just below the given element, tracking its on-screen
// position at the moment of filling.
function addBadge(el: Element, label: string) {
  const rect = el.getBoundingClientRect();
  const badge = document.createElement("div");
  badge.className = BADGE_CLASS;
  badge.textContent = `✓ ${label} filled`;
  badge.style.top = `${rect.bottom + window.scrollY + 4}px`;
  badge.style.left = `${rect.left + window.scrollX}px`;
  document.body.appendChild(badge);
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // React/MUI track value via the prototype setter; call it directly so the
  // framework's onChange fires and the field is considered "dirty".
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
 * Fills the current page's form using `map`, human-paced so each field visibly
 * lights up (like the reference flow) and React/MUI reliably registers each
 * change. Interruptible via the STOP AUTOFILL button.
 *
 * Field handling:
 *  - selector === ""  → skipped (field not present on this step, e.g. HSN/price
 *    only exist on later Meesho wizard steps)
 *  - selector present but element not found → reported as missing
 *
 * Safety: focuses the submit/next control at the end but NEVER clicks it — the
 * seller always reviews and advances themselves.
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
  const skipped: string[] = [];
  let stopped = false;

  stopRequested = false;
  injectStyles();
  clearOverlays();
  showStopButton();

  for (const [key, selector] of fieldOrder) {
    if (stopRequested) {
      stopped = true;
      break;
    }
    if (!selector) {
      skipped.push(key);
      continue;
    }
    const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) {
      missing.push(key);
      continue;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(200);
    el.classList.add(HIGHLIGHT_CLASS);
    el.focus();
    setNativeValue(el, vals[key]);
    addBadge(el, FIELD_LABELS[key]);
    filled.push(key);
    // Human pace: long enough to see the field light up, like the reference.
    await sleep(650);
  }

  let submitFocused = false;
  if (!stopped && map.submit) {
    const submitEl = document.querySelector(map.submit) as HTMLElement | null;
    if (submitEl) {
      submitEl.scrollIntoView({ behavior: "smooth", block: "center" });
      submitEl.focus();
      submitFocused = true;
    } else {
      missing.push("submit");
    }
  }

  removeStopButton();
  return { ok: true, filled, missing, skipped, submitFocused, stopped };
}

export default defineContentScript({
  matches: ["*://*.meesho.com/*", "http://localhost/*", "http://127.0.0.1/*"],
  main() {
    // Readiness marker so the side panel (or a test probe) can detect that the
    // declarative content script actually injected into this page.
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
          .catch((err) => {
            removeStopButton();
            sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
          });

        return true; // keep the message channel open for the async response
      },
    );
  },
});
