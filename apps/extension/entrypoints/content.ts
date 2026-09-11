<<<<<<< HEAD
import { SELECTOR_CONFIGS as MEESHO_SELECTORS, type MeeshoConfigId, type MeeshoSelectorMap } from "@neo/adapter-meesho";
import { SELECTOR_CONFIGS as AMAZON_SELECTORS, type AmazonConfigId, type AmazonSelectorMap } from "@neo/adapter-amazon";
import { SELECTOR_CONFIGS as FLIPKART_SELECTORS, type FlipkartConfigId, type FlipkartSelectorMap } from "@neo/adapter-flipkart";
import type { MarketplaceId } from "@neo/adapter";
=======
import { SELECTOR_CONFIGS, type MeeshoConfigId, type MeeshoSelectorMap } from "@neo/adapter-meesho";
import { injectScript, type ScriptPublicPath } from "#imports";
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9

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
<<<<<<< HEAD
  // When present, fill generically by field `name` instead of the fixed fixture
  // selector map. Keyed by the marketplace's stable `name` attribute
  // (e.g. { product_name, comment, color, fabric, occasion, ... }).
=======
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9
  fields?: Record<string, string>;
}

interface MeeshoAutofillMessage {
  type: "NEO_MEESHO_AUTOFILL";
  product: Record<string, unknown>;
}

interface MeeshoBulkGenerationMessage {
  type: "PROJECT_NEO_GENERATE_MEESHO_BULK";
  templateBase64: string;
  templateName?: string;
  templateType?: string;
  products: unknown[];
}

interface MeeshoInspectTemplateMessage {
  type: "PROJECT_NEO_INSPECT_MEESHO_TEMPLATE";
  templateBase64: string;
  templateName?: string;
  templateType?: string;
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

<<<<<<< HEAD
// Randomized delay (100–300ms) between field fills. Simulates human typing
// cadence to avoid triggering generic rate-limiters or bot-detection heuristics
// on Amazon Seller Central and Flipkart Seller Hub.
const humanDelay = () => sleep(100 + Math.floor(Math.random() * 200));
=======
function requestMeeshoAutofill(product: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const requestId = `neo-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.data?.source !== "PROJECT_NEO_MEESHO_MAIN" ||
        event.data?.type !== "PROJECT_NEO_AUTOFILL_RESULT" ||
        event.data?.requestId !== requestId
      ) {
        return;
      }

      window.removeEventListener("message", handler);

      const result = event.data?.result;

      if (result?.success === false && result?.error) {
        reject(new Error(result.error));
        return;
      }

      resolve(result);
    };

    window.addEventListener("message", handler);

    window.postMessage(
      {
        source: "PROJECT_NEO_EXTENSION",
        type: "PROJECT_NEO_AUTOFILL_MEESHO",
        requestId,
        product,
      },
      "*",
    );
  });
}

function requestMeeshoScrape(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const requestId = `neo-scrape-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.data?.source !== "PROJECT_NEO_MEESHO_MAIN" ||
        event.data?.type !== "PROJECT_NEO_SCRAPE_RESULT" ||
        event.data?.requestId !== requestId
      ) {
        return;
      }

      window.removeEventListener("message", handler);

      const result = event.data?.result;

      if (result?.success === false && result?.error) {
        reject(new Error(result.error));
        return;
      }

      resolve(result?.fields ?? {});
    };

    window.addEventListener("message", handler);

    window.postMessage({ source: "PROJECT_NEO_EXTENSION", type: "PROJECT_NEO_SCRAPE_MEESHO", requestId }, "*");
  });
}

function requestMeeshoBulkGeneration(payload: {
  templateBase64: string;
  templateName?: string;
  templateType?: string;
  products: unknown[];
}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const requestId = `neo-bulk-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.data?.source !== "PROJECT_NEO_MEESHO_MAIN" ||
        event.data?.type !== "PROJECT_NEO_BULK_RESULT" ||
        event.data?.requestId !== requestId
      ) {
        return;
      }

      window.removeEventListener("message", handler);

      const result = event.data?.result;

      if (result?.success === false && result?.error) {
        reject(new Error(result.error));
        return;
      }

      resolve(result);
    };

    window.addEventListener("message", handler);

    window.postMessage(
      {
        source: "PROJECT_NEO_EXTENSION",
        type: "PROJECT_NEO_GENERATE_MEESHO_BULK",
        requestId,
        templateBase64: payload.templateBase64,
        templateName: payload.templateName,
        templateType: payload.templateType,
        products: payload.products,
      },
      "*",
    );
  });
}

function requestMeeshoInspect(payload: {
  templateBase64: string;
  templateName?: string;
  templateType?: string;
}): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const requestId = `neo-inspect-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const handler = (event: MessageEvent) => {
      if (
        event.source !== window ||
        event.data?.source !== "PROJECT_NEO_MEESHO_MAIN" ||
        event.data?.type !== "PROJECT_NEO_INSPECT_RESULT" ||
        event.data?.requestId !== requestId
      ) {
        return;
      }

      window.removeEventListener("message", handler);

      const result = event.data?.result;

      if (result?.success === false && result?.error) {
        reject(new Error(result.error));
        return;
      }

      resolve(result);
    };

    window.addEventListener("message", handler);

    window.postMessage(
      {
        source: "PROJECT_NEO_EXTENSION",
        type: "PROJECT_NEO_INSPECT_MEESHO_TEMPLATE",
        requestId,
        templateBase64: payload.templateBase64,
        templateName: payload.templateName,
        templateType: payload.templateType,
      },
      "*",
    );
  });
}
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9

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

async function closeOpenPopovers() {
  for (let i = 0; i < 4; i++) {
    if (!document.querySelector(OPEN_POPOVER_SELECTOR)) return;

    const active = (document.activeElement as HTMLElement) ?? document.body;

    for (const target of [active, document.body]) {
      target.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          which: 27,
          bubbles: true,
        }),
      );
    }

    await sleep(120);
  }

  const backdrop = document.querySelector<HTMLElement>(".MuiBackdrop-root");
  backdrop?.click();
  await sleep(80);
}

async function fillDropdown(el: HTMLInputElement, value: string): Promise<boolean> {
  const wanted = value.trim().toLowerCase();

  try {
    el.focus();
    el.click();

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

    const partial = options.find(
      (o) =>
        norm(o).includes(wanted) ||
        (wanted.length > 3 && wanted.includes(norm(o))),
    );

    const choice = exact ?? partial;

    if (choice) {
      choice.click();
      await sleep(120);
      await closeOpenPopovers();
      return true;
    }

    return false;
  } finally {
    await closeOpenPopovers();
  }
}

<<<<<<< HEAD
// ---------------------------------------------------------------------------
// React Native Setter Hack (Amazon Seller Central).
//
// Amazon's React SPA tracks input values via React's internal fiber state.
// Setting `el.value = x` directly does NOT update the fiber — React still sees
// the old value and onChange never fires. The fix: grab the NATIVE property
// descriptor from the prototype chain (HTMLInputElement.prototype or
// HTMLTextAreaElement.prototype), call its setter, then dispatch a bubbling
// `input` event so React's synthetic event system picks up the change.
//
// This is the standard technique used by React Testing Library, Selenium
// adapters, and browser automation tools.
// ---------------------------------------------------------------------------
const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, "value",
)?.set;

const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLTextAreaElement.prototype, "value",
)?.set;

function setReactValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // Pick the correct native setter based on element type.
  const setter = el instanceof HTMLTextAreaElement
    ? nativeTextAreaValueSetter
    : nativeInputValueSetter;

  if (setter) {
    setter.call(el, value);
  } else {
    // Absolute fallback — should never happen in a real browser.
    el.value = value;
  }

  // React listens for `input` events on the document via event delegation.
  // The event MUST bubble and use the native Event constructor (not
  // InputEvent) for React 16+ compatibility.
  el.dispatchEvent(new Event("input", { bubbles: true }));

  // Some Amazon form fields also bind on `change` (e.g. price inputs that
  // format on commit). Dispatch it too — harmless if unused.
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// ---------------------------------------------------------------------------
// Angular Event Dispatcher (Flipkart Seller Hub).
//
// Flipkart's Angular reactive forms bind via ControlValueAccessor, which
// listens for `input` events to update the model and `blur` events to mark
// the control as "touched" (triggering validation). A simple `el.value = x`
// skips both — Angular never sees the change.
//
// The full sequence simulates a human interaction:
//   1. focus()  — activates the control, sets it as "focused"
//   2. Native setter — sets the DOM value without Angular interference
//   3. `input` event — ControlValueAccessor reads the new value
//   4. `change` event — some controls commit on change (selects, date pickers)
//   5. `blur` event — marks the control as "touched", triggers validation
// ---------------------------------------------------------------------------
function setAngularValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // Step 1: Focus the element (Angular tracks focus state).
  el.focus();

  // Step 2: Set the value using the native setter to bypass any Angular
  // getter/setter overrides on the element instance.
  const setter = el instanceof HTMLTextAreaElement
    ? nativeTextAreaValueSetter
    : nativeInputValueSetter;

  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }

  // Step 3: Dispatch input — ControlValueAccessor reads the new value.
  el.dispatchEvent(new Event("input", { bubbles: true }));

  // Step 4: Dispatch change — some controls commit on change.
  el.dispatchEvent(new Event("change", { bubbles: true }));

  // Step 5: Dispatch blur — marks control as "touched", triggers validation.
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
        setAngularValue(retryInput, value);
        filled.push(`col_${idx}`);
      } else {
        missing.push(`col_${idx}`);
      }
    }
    await humanDelay();
  }
  return { filled, missing };
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
      // Use the native setter to bypass React's synthetic event guard.
      const selectSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype, "value",
      )?.set;
      if (selectSetter) {
        selectSetter.call(el, opt.value);
      } else {
        el.value = opt.value;
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }
  return false;
}

/**
 * Generic fill by field `name` (live marketplace). Enumerates the values Neo has
 * and fills whichever fields exist on the current page — category-agnostic, since
 * marketplace fields carry a stable `name`. Fields not on the page are reported
 * missing; the seller reviews and submits themselves.
 *
 * Works across Meesho, Amazon Seller Central, and Flipkart Seller Hub.
 *   - Amazon: uses `setReactValue` (native prototype setter hack) so React's
 *     fiber state picks up the new value and onChange fires.
 *   - Flipkart: uses `setAngularValue` (focus → native set → input → change →
 *     blur) so Angular's ControlValueAccessor commits the value.
 *   - Meesho: uses `setNativeValue` (existing, proven approach).
 *
 * Amazon and Flipkart paths include a randomized human-simulation delay
 * (100–300ms) between fields to avoid triggering bot-detection heuristics.
 */
async function fillByName(
  fields: Record<string, string>,
  marketplace: MarketplaceId = "meesho",
): Promise<FillResponse> {
=======
async function fillByName(fields: Record<string, string>): Promise<FillResponse> {
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9
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

    const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${name}"]`,
    );

    if (!el) {
      missing.push(name);
      continue;
    }

    clearOverlays();
    el.scrollIntoView({ behavior: "auto", block: "center" });
    await sleep(120);

    let ok = true;
<<<<<<< HEAD
    if (el instanceof HTMLSelectElement) {
      // Amazon uses native <select> for some category fields.
      ok = await fillNativeSelect(el, value);
    } else if (el instanceof HTMLInputElement && isDropdown(el)) {
=======

    if (el instanceof HTMLInputElement && isDropdown(el)) {
>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9
      ok = await fillDropdown(el, value);
    } else if (marketplace === "amazon_in") {
      // React native setter hack — bypass React's fiber state guard.
      el.focus();
      setReactValue(el as HTMLInputElement | HTMLTextAreaElement, value);
    } else if (marketplace === "flipkart") {
      // Angular full event chain — focus + native set + input + change + blur.
      setAngularValue(el as HTMLInputElement | HTMLTextAreaElement, value);
    } else {
      // Meesho — existing proven approach.
      el.focus();
      setNativeValue(
        el as HTMLInputElement | HTMLTextAreaElement,
        value,
      );
    }

    if (ok) {
      popConfetti(el, `${labelFromName(name)} filled`);
      filled.push(name);
      // Human-simulation delay for Amazon/Flipkart; Meesho uses the original
      // fixed cadence to preserve existing behavior.
      if (marketplace === "amazon_in" || marketplace === "flipkart") {
        await humanDelay();
      } else {
        await sleep(360);
      }
    } else {
      missing.push(name);
    }
  }

  clearOverlays();
  await closeOpenPopovers();
  removeStopButton();

  return {
    ok: true,
    filled,
    missing,
    skipped,
    submitFocused: false,
    stopped,
  };
}

async function fillForm(
  map: MeeshoSelectorMap,
  vals: FillValues,
): Promise<FillResponse> {
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

    const el = document.querySelector(
      selector,
    ) as HTMLInputElement | HTMLTextAreaElement | null;

    if (!el) {
      missing.push(key);
      continue;
    }

    // "auto" (instant), not "smooth" -- popConfetti reads getBoundingClientRect()
    // right after, which must be the element's final position, not mid-scroll.
    el.scrollIntoView({ behavior: "auto", block: "center" });
    await sleep(220);
    el.focus();
    setNativeValue(el, vals[key]);
    popConfetti(el, `${FIELD_LABELS[key]} filled`);
    filled.push(key);
    await sleep(750);
  }

  let submitFocused = false;

  if (!stopped && map.submit) {
    const submitEl = document.querySelector(
      map.submit,
    ) as HTMLElement | null;

    if (submitEl) {
      submitEl.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      submitEl.focus();
      submitFocused = true;
    } else {
      missing.push("submit");
    }
  }

  removeStopButton();

  return {
    ok: true,
    filled,
    missing,
    skipped,
    submitFocused,
    stopped,
  };
}

/**
 * Fixed-field fill for Amazon fixture (id selectors). Uses the React native
 * setter hack to bypass React's fiber state guard. Fills all Amazon fields
 * from the selector map in sequence with human-simulation delays, then focuses
 * submit (never clicks).
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
    await sleep(120);
    el.focus();
    await humanDelay();
    const value = (vals as Record<string, string>)[key] ?? "";
    // React native setter hack — uses HTMLInputElement.prototype / HTMLTextAreaElement.prototype
    // value setter to bypass React's internal state tracking.
    setReactValue(el, value);
    popConfetti(el, `${labelFromName(key)} filled`);
    filled.push(key);
    await humanDelay();
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
 * Fixed-field fill for Flipkart fixture (id selectors). Uses the Angular event
 * dispatcher (focus → native set → input → change → blur) to commit values to
 * Angular's ControlValueAccessor. Human-simulation delays between fields avoid
 * triggering Flipkart's bot-detection heuristics.
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
    await sleep(120);
    const value = (vals as Record<string, string>)[key] ?? "";
    // Angular full event chain — setAngularValue handles focus() internally,
    // then native set → input → change → blur to commit the FormControl state.
    await humanDelay();
    setAngularValue(el, value);
    popConfetti(el, `${labelFromName(key)} filled`);
    filled.push(key);
    await humanDelay();
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
<<<<<<< HEAD
  matches: [
    "*://*.meesho.com/*",
    "*://*.sellercentral.amazon.in/*",
    "*://*.sellercentral.amazon.com/*",
    "*://*.seller.flipkart.com/*",
  ],
  main() {
=======
  matches: ["*://*.meesho.com/*"],

  async main() {
    // Inject the main-world script that exposes window.meeshoAutofill.
    await injectScript("/meesho-main-world.js" as ScriptPublicPath, {
      keepInDom: true,
    });

>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9
    // Readiness marker so the side panel (or a test probe) can detect that the
    // declarative content script actually injected into this page.
    (window as unknown as { __NEO_CONTENT__?: boolean }).__NEO_CONTENT__ = true;

    const chrome = (globalThis as { chrome?: any }).chrome;

    if (!chrome?.runtime?.onMessage) return;

    chrome.runtime.onMessage.addListener(
      (
        message:
  | FillMessage
  | MeeshoAutofillMessage
  | MeeshoBulkGenerationMessage
  | MeeshoInspectTemplateMessage
  | { type: "NEO_SCRAPE_MEESHO" },
        _sender: unknown,
        sendResponse: (
  response:
    | FillResponse
    | { ok: true; fields: Record<string, string> }
    | { ok: false; error: string }
    | { success: boolean; error?: string },
) => void,
      ) => {
        if (!message) return false;

if (message.type === "PROJECT_NEO_GENERATE_MEESHO_BULK") {
  requestMeeshoBulkGeneration({
    templateBase64: message.templateBase64,
    templateName: message.templateName,
    templateType: message.templateType,
    products: message.products,
  })
    .then((result: any) => {
      sendResponse(result);
    })
    .catch((err) => {
      sendResponse({
        success: false,
        error:
          err instanceof Error
            ? err.message
            : String(err),
      });
    });

  return true;
}

if (message.type === "PROJECT_NEO_INSPECT_MEESHO_TEMPLATE") {
  requestMeeshoInspect({
    templateBase64: (message as any).templateBase64,
    templateName: (message as any).templateName,
    templateType: (message as any).templateType,
  })
    .then((result: any) => sendResponse(result))
    .catch((err) => sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }));
  return true;
}

        // New full Meesho autofill engine.
        if (message.type === "NEO_MEESHO_AUTOFILL") {
  requestMeeshoAutofill(message.product)
    .then((result: any) => {
      // `result.failed` holds fields the engine found and wrote but which
      // never verified (e.g. business-details fields Meesho's own onChange
      // handling rejected or reformatted) -- fold them into `missing` so the
      // seller sees them instead of the run silently reporting success.
      const failedFields: string[] = Array.isArray(result?.failed)
        ? result.failed.map((f: any) => f?.field).filter(Boolean)
        : [];

      sendResponse({
        ok: true,
        filled: result?.filled ?? [],
        missing: [...(result?.requiredMissing ?? []), ...failedFields],
        skipped: result?.skipped ?? [],
        submitFocused: false,
        stopped: result?.stopped ?? false,
      });
    })
            .catch((err) => {
              sendResponse({
                ok: false,
                error:
                  err instanceof Error
                    ? err.message
                    : String(err),
              });
            });

          return true;
        }

        if (message.type === "NEO_SCRAPE_MEESHO") {
          requestMeeshoScrape()
            .then((fields) => sendResponse({ ok: true, fields }))
            .catch((err) =>
              sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) }),
            );

          return true;
        }

        // Existing generic/fixture autofill path.
        if (message.type !== "NEO_FILL") return false;

        const marketplace = message.marketplace ?? detectMarketplace();

        const done = (result: FillResponse) => sendResponse(result);

        const fail = (err: unknown) => {
          removeStopButton();

          sendResponse({
            ok: false,
            error:
              err instanceof Error
                ? err.message
                : String(err),
          });
        };

<<<<<<< HEAD
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
=======
        if (message.fields) {
          fillByName(message.fields)
            .then(done)
            .catch(fail);

          return true;
        }

        const map = SELECTOR_CONFIGS[message.config];

>>>>>>> c7923eab97cb209bcbe3876ee06576439151e2d9
        if (!map) {
          sendResponse({
            ok: false,
            error: `Unknown selector config: ${message.config}`,
          });

          return true;
        }

        fillForm(map, message.values)
          .then(done)
          .catch(fail);

        return true;
      },
    );
  },
});
