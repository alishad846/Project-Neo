import {
  SELECTOR_CONFIGS as MEESHO_SELECTORS,
  type MeeshoConfigId,
  type MeeshoSelectorMap,
} from "@neo/adapter-meesho";

import {
  SELECTOR_CONFIGS as FLIPKART_SELECTORS,
  type FlipkartConfigId,
  type FlipkartSelectorMap,
} from "@neo/adapter-flipkart";

import type { MarketplaceId } from "@neo/adapter";
import { injectScript, type ScriptPublicPath } from "#imports";

export interface FillValues {
  title: string;
  description: string;
  hsnCode: string;
  sellingPrice: string;
}

interface FillMessage {
  type: "NEO_FILL";
  marketplace?: MarketplaceId;
  config: string;
  values: FillValues;
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
interface FlipkartBulkFillMessage {
  type: "PROJECT_NEO_FILL_FLIPKART_BULK";
  rows: Array<Record<string, string>>;
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

// Human-readable labels for the fixed fixture fields (for the "✓ filled" badge).
const FIELD_LABELS: Record<keyof FillValues, string> = {
  title: "Product Name",
  description: "Description",
  hsnCode: "HSN Code",
  sellingPrice: "Selling Price",
};

// Turn a Meesho field `name` (snake_case) into a friendly badge label:
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
function setAngularValue(
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) {
  setNativeValue(el, value);

  // Flipkart uses Angular reactive forms.
  // Blur helps Angular commit the updated form-control value.
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}
function normalizeFlipkartHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getFlipkartColumnMap(): Record<string, number> {
  let headers = Array.from(
    document.querySelectorAll<HTMLElement>('[role="columnheader"]'),
  );

  if (headers.length === 0) {
    headers = Array.from(
      document.querySelectorAll<HTMLElement>("th"),
    );
  }

  const aliases: Record<string, string[]> = {
    skuId: ["sku", "skuid", "seller sku", "seller sku id"],
    productName: ["product name", "product title", "title"],
    brand: ["brand"],
    mrp: ["mrp", "maximum retail price"],
    sellingPrice: ["selling price", "sale price", "price"],
    hsnCode: ["hsn", "hsn code"],
    procurementSla: ["procurement sla", "sla"],
    stockCount: ["stock", "stock count", "inventory", "quantity"],
    shippingDays: ["shipping days", "shipping time"],
  };

  const map: Record<string, number> = {};

  headers.forEach((header, index) => {
    const headerText = normalizeFlipkartHeader(
      header.textContent ?? "",
    );

    for (const [field, names] of Object.entries(aliases)) {
      const matched = names.some((name) => {
        const normalizedName = normalizeFlipkartHeader(name);

        return (
          headerText === normalizedName ||
          headerText.includes(normalizedName)
        );
      });

      if (matched && map[field] === undefined) {
        map[field] = index;
      }
    }
  });

  return map;
}

async function fillFlipkartGridRow(
  row: Element,
  values: Record<string, string>,
  columnMap: Record<string, number>,
): Promise<{ filled: string[]; missing: string[] }> {
  const cells = row.querySelectorAll('[role="gridcell"]');

  const filled: string[] = [];
  const missing: string[] = [];

  for (const [field, value] of Object.entries(values)) {
    if (!value) continue;

    const columnIndex = columnMap[field];

    if (columnIndex === undefined) {
      missing.push(field);
      continue;
    }

    const cell = cells[columnIndex];

    if (!cell) {
      missing.push(field);
      continue;
    }

    let input =
      cell.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        "input, textarea",
      );

    if (!input) {
      (cell as HTMLElement).click();
      await sleep(150);

      input =
        cell.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          "input, textarea",
        );
    }

    if (input) {
      input.focus();
      setAngularValue(input, value);
      filled.push(field);
    } else {
      const editable =
        cell.querySelector<HTMLElement>("[contenteditable]");

      if (editable) {
        editable.focus();
        editable.textContent = value;
        editable.dispatchEvent(
          new Event("input", { bubbles: true }),
        );
        editable.dispatchEvent(
          new Event("blur", { bubbles: true }),
        );

        filled.push(field);
      } else {
        missing.push(field);
      }
    }

    await sleep(150);
  }

  return { filled, missing };
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

    if (el instanceof HTMLInputElement && isDropdown(el)) {
  ok = await fillDropdown(el, value);
} else if (marketplace === "flipkart") {
  el.focus();

  setAngularValue(
    el as HTMLInputElement | HTMLTextAreaElement,
    value,
  );
} else {
  el.focus();

  setNativeValue(
    el as HTMLInputElement | HTMLTextAreaElement,
    value,
  );
}

    if (ok) {
      popConfetti(el, `${labelFromName(name)} filled`);
      filled.push(name);
      await sleep(360);
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
async function fillFlipkartForm(
  map: FlipkartSelectorMap,
  vals: FillValues & Record<string, string>,
): Promise<FillResponse> {
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
    if (stopRequested) {
      stopped = true;
      break;
    }

    if (!selector) {
      skipped.push(key);
      continue;
    }

    const value = vals[key] ?? "";

    if (!value) {
      skipped.push(key);
      continue;
    }

    const el = document.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >(selector);

    if (!el) {
      missing.push(key);
      continue;
    }

    clearOverlays();

    el.scrollIntoView({
      behavior: "auto",
      block: "center",
    });

    await sleep(120);

    el.focus();
    setAngularValue(el, value);

    popConfetti(el, `${labelFromName(key)} filled`);

    filled.push(key);

    await sleep(360);
  }

  clearOverlays();
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
function detectMarketplace(): MarketplaceId {
  const host = window.location.hostname;

  if (/seller\.flipkart\.com$/i.test(host)) {
    return "flipkart";
  }

  return "meesho";
}

export default defineContentScript({
  matches: [
  "*://*.meesho.com/*",
  "*://*.seller.flipkart.com/*",
],

  async main() {
    // Inject the main-world script that exposes window.meeshoAutofill.
    const marketplace = detectMarketplace();

if (marketplace === "meesho") {
  await injectScript("/meesho-main-world.js" as ScriptPublicPath, {
    keepInDom: true,
  });
}

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
  | FlipkartBulkFillMessage
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
if (message.type === "PROJECT_NEO_FILL_FLIPKART_BULK") {
  const run = async () => {
    if (detectMarketplace() !== "flipkart") {
      throw new Error(
        "Open the Flipkart Seller Hub bulk catalogue page first.",
      );
    }

    const columnMap = getFlipkartColumnMap();

    if (Object.keys(columnMap).length === 0) {
      throw new Error(
        "Could not detect Flipkart bulk catalogue columns.",
      );
    }

    const gridRows = Array.from(
      document.querySelectorAll('[role="row"]'),
    ).filter(
      (row) =>
        row.querySelectorAll('[role="gridcell"]').length > 0,
    );

    if (gridRows.length === 0) {
      throw new Error(
        "Could not find editable Flipkart catalogue rows.",
      );
    }

    const rowsToFill = Math.min(
      message.rows.length,
      gridRows.length,
    );

    for (let index = 0; index < rowsToFill; index++) {
      await fillFlipkartGridRow(
        gridRows[index],
        message.rows[index],
        columnMap,
      );
    }

    return {
      success: true,
    };
  };

  run()
    .then((result) => {
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

        // New full Meesho autofill engine.
        if (message.type === "NEO_MEESHO_AUTOFILL") {
  requestMeeshoAutofill(message.product)
    .then((result: any) => {
      sendResponse({
        ok: true,
        filled: result?.filled ?? [],
        missing: result?.requiredMissing ?? [],
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

const marketplace =
  message.marketplace ?? detectMarketplace();

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

        if (message.fields) {
  fillByName(message.fields, marketplace)
    .then(done)
    .catch(fail);

  return true;
}
if (marketplace === "flipkart") {
  const map =
    FLIPKART_SELECTORS[
      message.config as FlipkartConfigId
    ];

  if (!map) {
    sendResponse({
      ok: false,
      error: `Unknown Flipkart selector config: ${message.config}`,
    });

    return true;
  }

  fillFlipkartForm(
    map,
    message.values as FillValues & Record<string, string>,
  )
    .then(done)
    .catch(fail);

  return true;
}
        const map =
  MEESHO_SELECTORS[
    message.config as MeeshoConfigId
  ];

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
