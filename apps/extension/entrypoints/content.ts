import { SELECTOR_CONFIGS as MEESHO_SELECTORS, type MeeshoConfigId, type MeeshoSelectorMap } from "@neo/adapter-meesho";
import { SELECTOR_CONFIGS as AMAZON_SELECTORS, type AmazonConfigId, type AmazonSelectorMap } from "@neo/adapter-amazon";
import { SELECTOR_CONFIGS as FLIPKART_SELECTORS, type FlipkartConfigId, type FlipkartSelectorMap } from "@neo/adapter-flipkart";
import type { MarketplaceId } from "@neo/adapter";

export interface FillValues {
  title: string;
  description: string;
  hsnCode: string;
  sellingPrice: string;
}

interface FillMessage {
  type: "NEO_FILL";
  // Marketplace discriminant — when omitted, defaults to "meesho" for backward
  // compatibility with existing side-panel code that hasn't been updated yet.
  marketplace?: MarketplaceId;
  config: string;
  values: FillValues;
  // When present, fill generically by field `name` instead of the fixed fixture
  // selector map. Keyed by the marketplace's stable `name` attribute
  // (e.g. { product_name, comment, color, fabric, occasion, ... }).
  fields?: Record<string, string>;
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

// Human-readable labels for the fixed fixture fields (for the "✓ filled" badge).
const FIELD_LABELS: Record<keyof FillValues, string> = {
  title: "Product Name",
  description: "Description",
  hsnCode: "HSN Code",
  sellingPrice: "Selling Price",
};

// Turn a marketplace field `name` (snake_case) into a friendly badge label:
// "sleeve_length" -> "Sleeve Length".
function labelFromName(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Autofill overlay UX (Neo pink). As each field fills, a confetti "pop" appears
// just above it, then fades as the next field fills — one at a time, in sequence.
// Fields themselves are NOT highlighted. A floating "STOP AUTOFILL" button lets
// the seller halt. All namespaced `neo-af-` so it can't collide with the host.
// ---------------------------------------------------------------------------
const STYLE_ID = "neo-af-styles";
const STOP_BTN_ID = "neo-af-stop";
const POP_CLASS = "neo-af-pop";

// Confetti colours (Neo palette).
const CONFETTI_COLORS = ["#ff90e8", "#b2ff59", "#00e5ff", "#ffeb3b", "#a06bff", "#ff8a65"];

// Set true by the STOP AUTOFILL button; the fill loop checks it between fields.
let stopRequested = false;

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${POP_CLASS} {
      position: fixed; z-index: 2147483646; transform: translateX(-50%);
      pointer-events: none; will-change: transform, opacity;
    }
    .${POP_CLASS} .neo-af-pill {
      display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
      padding: 4px 12px; font: 700 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #000; background: #ff90e8; border: 2px solid #000; border-radius: 9999px;
      box-shadow: 2px 2px 0 0 #000;
      animation: neo-pop-in 0.16s cubic-bezier(.34,1.56,.64,1) forwards, neo-pop-out 0.22s ease-in 0.42s forwards;
    }
    .${POP_CLASS} .neo-af-confetti {
      position: absolute; left: 50%; top: 50%; width: 7px; height: 7px; border-radius: 2px;
      animation: neo-confetti 0.6s ease-out forwards;
    }
    @keyframes neo-pop-in { from { opacity: 0; transform: scale(0.6) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes neo-pop-out { to { opacity: 0; transform: translateY(-12px) scale(0.95); } }
    @keyframes neo-confetti { from { opacity: 1; transform: translate(0,0) rotate(0deg); } to { opacity: 0; transform: translate(var(--dx), var(--dy)) rotate(var(--r)); } }
    #${STOP_BTN_ID} {
      position: fixed; top: 16px; left: 50%; transform: translateX(-50%); z-index: 2147483647;
      display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px;
      font: 700 15px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0.5px;
      color: #000; background: #ff90e8; border: 3px solid #000; border-radius: 9999px;
      box-shadow: 4px 4px 0 0 #000; cursor: pointer; transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    #${STOP_BTN_ID}:hover { transform: translateX(-50%) translateY(-2px); box-shadow: 5px 6px 0 0 #000; }
    #${STOP_BTN_ID}:active { transform: translateX(-50%) translateY(1px); box-shadow: 1px 1px 0 0 #000; }
    #${STOP_BTN_ID} .neo-af-stopdot { width: 12px; height: 12px; background: #000; border-radius: 2px; }
    @media (prefers-reduced-motion: reduce) {
      .${POP_CLASS} .neo-af-pill, .${POP_CLASS} .neo-af-confetti { animation-duration: 0.001ms !important; }
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
  document.querySelectorAll(`.${POP_CLASS}`).forEach((n) => n.remove());
  // Remove any stray highlight from earlier builds.
  document.querySelectorAll(".neo-af-highlight").forEach((n) => n.classList.remove("neo-af-highlight"));
}

// Show a one-shot confetti pop just above `el`, then let it fade. Only one pop
// exists at a time (the previous is cleared first), so they read as a sequence.
// Positioned `fixed` from the field's viewport rect — the field is scrolled into
// view before this runs, and the pop is short-lived, so it never drifts.
function popConfetti(el: Element, label: string) {
  clearOverlays();
  const rect = el.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.className = POP_CLASS;
  pop.style.left = `${rect.left + rect.width / 2}px`;
  pop.style.top = `${Math.max(8, rect.top - 14)}px`;

  const pill = document.createElement("div");
  pill.className = "neo-af-pill";
  pill.textContent = `🎉 ${label}`;
  pop.appendChild(pill);

  // A small confetti burst radiating from the pill.
  for (let i = 0; i < 8; i++) {
    const piece = document.createElement("span");
    piece.className = "neo-af-confetti";
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? "#ff90e8";
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.5;
    const dist = 26 + Math.random() * 22;
    piece.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    piece.style.setProperty("--dy", `${Math.sin(angle) * dist - 10}px`);
    piece.style.setProperty("--r", `${Math.round((Math.random() - 0.5) * 540)}deg`);
    pop.appendChild(piece);
  }

  document.body.appendChild(pop);
  window.setTimeout(() => pop.remove(), 750);
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

// A field is a (readonly) dropdown/select rather than a free-text input.
function isDropdown(el: HTMLInputElement): boolean {
  return (
    el.readOnly ||
    el.getAttribute("placeholder") === "Select" ||
    el.getAttribute("role") === "combobox" ||
    el.getAttribute("aria-haspopup") === "listbox"
  );
}

const OPTION_SELECTOR = '[role="option"], li.MuiMenuItem-root, li.MuiAutocomplete-option';
const OPEN_POPOVER_SELECTOR = '[role="listbox"], .MuiAutocomplete-popper, .MuiPopover-root, .MuiMenu-root';

function visibleOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(OPTION_SELECTOR)).filter(
    (o) => o.offsetParent !== null,
  );
}

// Reliably close any open MUI popover/menu. MUI listens for Escape to close and
// UNLOCK body scroll — clicking away is unreliable and can leave the scroll lock
// in place (the "whole site is frozen" bug). Sends Escape until nothing is open.
async function closeOpenPopovers() {
  for (let i = 0; i < 4; i++) {
    if (!document.querySelector(OPEN_POPOVER_SELECTOR)) return;
    const active = (document.activeElement as HTMLElement) ?? document.body;
    for (const target of [active, document.body]) {
      target.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true }),
      );
    }
    await sleep(120);
  }
  // Last resort: MUI backdrop click.
  const backdrop = document.querySelector<HTMLElement>(".MuiBackdrop-root");
  backdrop?.click();
  await sleep(80);
}

// Open a MUI-style dropdown and click the option whose visible text best matches
// `value`. ALWAYS closes the popover afterwards (success or fail) so it can never
// be left open blocking the page. Overwrites any existing selection.
async function fillDropdown(el: HTMLInputElement, value: string): Promise<boolean> {
  const wanted = value.trim().toLowerCase();
  try {
    el.focus();
    el.click();

    // Poll for the options to render (portals can be slow); type into a search
    // box if the dropdown has one.
    let options: HTMLElement[] = [];
    for (let i = 0; i < 8 && options.length === 0; i++) {
      await sleep(140);
      options = visibleOptions();
    }
    const search = document.querySelector<HTMLInputElement>(
      '.MuiAutocomplete-popper input, [role="listbox"] input:not([readonly])',
    );
    if (search) {
      setNativeValue(search, value);
      await sleep(280);
      options = visibleOptions();
    }

    const norm = (o: HTMLElement) => (o.textContent ?? "").trim().toLowerCase();
    const exact = options.find((o) => norm(o) === wanted);
    const partial = options.find((o) => norm(o).includes(wanted) || (wanted.length > 3 && wanted.includes(norm(o))));
    const choice = exact ?? partial;

    if (choice) {
      choice.click();
      await sleep(120);
      await closeOpenPopovers();
      return true;
    }
    return false;
  } finally {
    // Whatever happened, never leave a dropdown open.
    await closeOpenPopovers();
  }
}

// ---------------------------------------------------------------------------
// Amazon-specific: fill a native <select> element by value or visible text.
// Amazon Seller Central uses both standard <select> and React-select widgets.
// ---------------------------------------------------------------------------
async function fillNativeSelect(el: HTMLSelectElement, value: string): Promise<boolean> {
  const wanted = value.trim().toLowerCase();
  for (const opt of Array.from(el.options)) {
    if (
      opt.value.toLowerCase() === wanted ||
      (opt.textContent ?? "").trim().toLowerCase() === wanted
    ) {
      el.value = opt.value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Flipkart-specific: fill an Angular reactive-form input. Angular binds via
// input + blur events on the element directly. We dispatch both to ensure the
// form control picks up the value change.
// ---------------------------------------------------------------------------
function setAngularValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  setNativeValue(el, value);
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

// ---------------------------------------------------------------------------
// Flipkart bulk grid fill — fills cells in a `[role="grid"]` table by mapping
// column indices to field values. Each `[role="row"]` contains `[role="gridcell"]`
// elements. Editable cells contain an inner `input` or `span[contenteditable]`.
// ---------------------------------------------------------------------------
async function fillGridRow(
  row: Element,
  columnMap: Record<number, string>,
): Promise<{ filled: string[]; missing: string[] }> {
  const cells = row.querySelectorAll('[role="gridcell"]');
  const filled: string[] = [];
  const missing: string[] = [];

  for (const [colIdx, value] of Object.entries(columnMap)) {
    const idx = Number(colIdx);
    const cell = cells[idx];
    if (!cell || !value) {
      if (value) missing.push(`col_${idx}`);
      continue;
    }

    // Try to find an editable element within the cell.
    const input = cell.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
    const editable = cell.querySelector<HTMLElement>("[contenteditable]");

    if (input) {
      input.focus();
      setAngularValue(input, value);
      filled.push(`col_${idx}`);
    } else if (editable) {
      editable.focus();
      editable.textContent = value;
      editable.dispatchEvent(new Event("input", { bubbles: true }));
      editable.dispatchEvent(new Event("blur", { bubbles: true }));
      filled.push(`col_${idx}`);
    } else {
      // Cell exists but has no editable child — click to activate, then retry.
      (cell as HTMLElement).click();
      await sleep(200);
      const retryInput = cell.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
      if (retryInput) {
        retryInput.focus();
        setAngularValue(retryInput, value);
        filled.push(`col_${idx}`);
      } else {
        missing.push(`col_${idx}`);
      }
    }
    await sleep(100);
  }
  return { filled, missing };
}

/**
 * Generic fill by field `name` (live marketplace). Enumerates the values Neo has
 * and fills whichever fields exist on the current page — category-agnostic, since
 * marketplace fields carry a stable `name`. Fields not on the page are reported
 * missing; the seller reviews and submits themselves.
 *
 * Works across Meesho, Amazon Seller Central, and Flipkart Seller Hub.
 * Amazon and Flipkart inputs are filled using the same `setNativeValue` approach
 * since both are React/Angular apps that respond to synthetic input/change events.
 * Flipkart fields additionally receive a `blur` event for Angular form binding.
 */
async function fillByName(
  fields: Record<string, string>,
  marketplace: MarketplaceId = "meesho",
): Promise<FillResponse> {
  const filled: string[] = [];
  const missing: string[] = [];
  const skipped: string[] = [];
  let stopped = false;

  stopRequested = false;
  injectStyles();
  clearOverlays();
  showStopButton();

  for (const [name, value] of Object.entries(fields)) {
    if (stopRequested) {
      stopped = true;
      break;
    }
    if (!value) {
      skipped.push(name);
      continue;
    }
    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
    if (!el) {
      missing.push(name);
      continue;
    }

    // Clear the previous pop BEFORE scrolling so it never lingers on-screen
    // while the page moves to the next field.
    clearOverlays();
    el.scrollIntoView({ behavior: "auto", block: "center" });
    await sleep(120);

    let ok = true;
    if (el instanceof HTMLSelectElement) {
      // Amazon uses native <select> for some category fields.
      ok = await fillNativeSelect(el, value);
    } else if (el instanceof HTMLInputElement && isDropdown(el)) {
      ok = await fillDropdown(el, value);
    } else if (marketplace === "flipkart") {
      // Flipkart Angular reactive forms need blur event for binding.
      el.focus();
      setAngularValue(el as HTMLInputElement | HTMLTextAreaElement, value);
    } else {
      el.focus();
      setNativeValue(el as HTMLInputElement | HTMLTextAreaElement, value);
    }

    if (ok) {
      popConfetti(el, `${labelFromName(name)} filled`);
      filled.push(name);
      await sleep(360);
    } else {
      // Element found but no matching option — surface it so the seller knows.
      missing.push(name);
    }
  }

  clearOverlays();
  await closeOpenPopovers();
  removeStopButton();
  return { ok: true, filled, missing, skipped, submitFocused: false, stopped };
}

/**
 * Legacy fixed-field fill for the local demo/fixture (id selectors). Focuses the
 * submit control at the end but NEVER clicks it.
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
    await sleep(220);
    el.focus();
    setNativeValue(el, vals[key]);
    popConfetti(el, `${FIELD_LABELS[key]} filled`);
    filled.push(key);
    await sleep(750);
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

/**
 * Fixed-field fill for Amazon fixture (id selectors). Fills all Amazon fields
 * from the selector map in sequence, then focuses submit (never clicks).
 */
async function fillAmazonForm(map: AmazonSelectorMap, vals: FillValues & Record<string, string>): Promise<FillResponse> {
  const fieldOrder: Array<[string, string]> = [
    ["productName", map.productName],
    ["description", map.description],
    ["brandName", map.brandName],
    ["bulletPoint1", map.bulletPoint1],
    ["bulletPoint2", map.bulletPoint2],
    ["bulletPoint3", map.bulletPoint3],
    ["mrp", map.mrp],
    ["sellingPrice", map.sellingPrice],
    ["hsnCode", map.hsnCode],
    ["skuId", map.skuId],
    ["quantity", map.quantity],
    ["searchKeywords", map.searchKeywords],
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
    if (stopRequested) { stopped = true; break; }
    if (!selector) { skipped.push(key); continue; }
    const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) { missing.push(key); continue; }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(220);
    el.focus();
    const value = (vals as Record<string, string>)[key] ?? "";
    setNativeValue(el, value);
    popConfetti(el, `${labelFromName(key)} filled`);
    filled.push(key);
    await sleep(750);
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

/**
 * Fixed-field fill for Flipkart fixture (id selectors). Uses Angular-style
 * blur dispatch for form binding.
 */
async function fillFlipkartForm(map: FlipkartSelectorMap, vals: FillValues & Record<string, string>): Promise<FillResponse> {
  const fieldOrder: Array<[string, string]> = [
    ["productName", map.productName],
    ["description", map.description],
    ["brand", map.brand],
    ["mrp", map.mrp],
    ["sellingPrice", map.sellingPrice],
    ["hsnCode", map.hsnCode],
    ["skuId", map.skuId],
    ["procurementSla", map.procurementSla],
    ["stockCount", map.stockCount],
    ["shippingDays", map.shippingDays],
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
    if (stopRequested) { stopped = true; break; }
    if (!selector) { skipped.push(key); continue; }
    const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) { missing.push(key); continue; }

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(220);
    el.focus();
    const value = (vals as Record<string, string>)[key] ?? "";
    setAngularValue(el, value);
    popConfetti(el, `${labelFromName(key)} filled`);
    filled.push(key);
    await sleep(750);
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

// ---------------------------------------------------------------------------
// Marketplace detection from the current page URL.
// ---------------------------------------------------------------------------
function detectMarketplace(): MarketplaceId {
  const host = window.location.hostname;
  if (/sellercentral\.amazon\.(in|com)$/i.test(host)) return "amazon_in";
  if (/seller\.flipkart\.com$/i.test(host)) return "flipkart";
  return "meesho";
}

export default defineContentScript({
  matches: [
    "*://*.meesho.com/*",
    "*://*.sellercentral.amazon.in/*",
    "*://*.sellercentral.amazon.com/*",
    "*://*.seller.flipkart.com/*",
  ],
  main() {
    // Readiness marker so the side panel (or a test probe) can detect that the
    // declarative content script actually injected into this page.
    (window as unknown as { __NEO_CONTENT__?: boolean }).__NEO_CONTENT__ = true;

    const chrome = (globalThis as { chrome?: any }).chrome;
    if (!chrome?.runtime?.onMessage) return;

    chrome.runtime.onMessage.addListener(
      (message: FillMessage, _sender: unknown, sendResponse: (response: FillResponse | { ok: false; error: string }) => void) => {
        if (!message || message.type !== "NEO_FILL") return false;

        const marketplace = message.marketplace ?? detectMarketplace();

        const done = (result: FillResponse) => sendResponse(result);
        const fail = (err: unknown) => {
          removeStopButton();
          sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
        };

        // Generic name-based fill (live marketplace) when `fields` is provided.
        if (message.fields) {
          fillByName(message.fields, marketplace).then(done).catch(fail);
          return true;
        }

        // --------------- Fixture / fixed-field fill per marketplace ---------------
        if (marketplace === "amazon_in") {
          const map = AMAZON_SELECTORS[message.config as AmazonConfigId];
          if (!map) {
            sendResponse({ ok: false, error: `Unknown Amazon selector config: ${message.config}` });
            return true;
          }
          fillAmazonForm(map, message.values as FillValues & Record<string, string>).then(done).catch(fail);
          return true;
        }

        if (marketplace === "flipkart") {
          const map = FLIPKART_SELECTORS[message.config as FlipkartConfigId];
          if (!map) {
            sendResponse({ ok: false, error: `Unknown Flipkart selector config: ${message.config}` });
            return true;
          }
          fillFlipkartForm(map, message.values as FillValues & Record<string, string>).then(done).catch(fail);
          return true;
        }

        // Default: Meesho (backward compatible)
        const map = MEESHO_SELECTORS[message.config as MeeshoConfigId];
        if (!map) {
          sendResponse({ ok: false, error: `Unknown selector config: ${message.config}` });
          return true;
        }
        fillForm(map, message.values).then(done).catch(fail);
        return true; // keep the message channel open for the async response
      },
    );
  },
});
