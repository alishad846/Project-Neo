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
  // When present (live Meesho), fill generically by field `name` instead of the
  // fixed fixture selector map. Keyed by Meesho's stable `name` attribute
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
      animation: neo-pop-in 0.28s cubic-bezier(.34,1.56,.64,1) forwards, neo-pop-out 0.35s ease-in 0.85s forwards;
    }
    .${POP_CLASS} .neo-af-confetti {
      position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; border-radius: 2px;
      animation: neo-confetti 0.9s ease-out forwards;
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
  window.setTimeout(() => pop.remove(), 1300);
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

// Open a MUI-style dropdown and click the option whose visible text best matches
// `value` (case-insensitive; exact match preferred, else contains). Returns true
// if an option was chosen. Best-effort — the live listbox markup is the source
// of truth for valid values, so we only ever pick an option Meesho offers.
async function fillDropdown(el: HTMLInputElement, value: string): Promise<boolean> {
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus();
  el.click();
  await sleep(300);

  const wanted = value.trim().toLowerCase();
  const options = Array.from(
    document.querySelectorAll('[role="option"], li.MuiMenuItem-root, li.MuiAutocomplete-option'),
  ).filter((o) => (o as HTMLElement).offsetParent !== null);

  // Some dropdowns render a search box in the popover; type to narrow if present.
  const search = document.querySelector<HTMLInputElement>(
    '.MuiAutocomplete-popper input, [role="listbox"] input:not([readonly])',
  );
  if (search) {
    setNativeValue(search, value);
    await sleep(300);
  }

  const pool = Array.from(
    document.querySelectorAll('[role="option"], li.MuiMenuItem-root, li.MuiAutocomplete-option'),
  ).filter((o) => (o as HTMLElement).offsetParent !== null);
  const candidates = pool.length ? pool : options;

  const exact = candidates.find((o) => (o.textContent ?? "").trim().toLowerCase() === wanted);
  const partial = candidates.find((o) => (o.textContent ?? "").trim().toLowerCase().includes(wanted));
  const choice = (exact ?? partial) as HTMLElement | undefined;

  if (choice) {
    choice.click();
    await sleep(150);
    return true;
  }

  // No match — close the popover so it doesn't block the next field.
  document.body.click();
  return false;
}

/**
 * Generic fill by field `name` (live Meesho). Enumerates the values Neo has and
 * fills whichever fields exist on the current page — category-agnostic, since
 * every Meesho field (text and dropdown) carries a stable `name`. Fields not on
 * the page are reported missing; the seller reviews and submits themselves.
 */
async function fillByName(fields: Record<string, string>): Promise<FillResponse> {
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

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(220);

    let ok = true;
    if (el instanceof HTMLInputElement && isDropdown(el)) {
      ok = await fillDropdown(el, value);
    } else {
      el.focus();
      setNativeValue(el as HTMLInputElement | HTMLTextAreaElement, value);
    }

    if (ok) {
      popConfetti(el, `${labelFromName(name)} filled`);
      filled.push(name);
      // Let the pop play before moving on, so the pops read as a sequence.
      await sleep(750);
    } else {
      // Element found but no matching option — surface it so the seller knows.
      missing.push(name);
    }
  }

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

export default defineContentScript({
  matches: ["*://*.meesho.com/*"],
  main() {
    // Readiness marker so the side panel (or a test probe) can detect that the
    // declarative content script actually injected into this page.
    (window as unknown as { __NEO_CONTENT__?: boolean }).__NEO_CONTENT__ = true;

    const chrome = (globalThis as { chrome?: any }).chrome;
    if (!chrome?.runtime?.onMessage) return;

    chrome.runtime.onMessage.addListener(
      (message: FillMessage, _sender: unknown, sendResponse: (response: FillResponse | { ok: false; error: string }) => void) => {
        if (!message || message.type !== "NEO_FILL") return false;

        const done = (result: FillResponse) => sendResponse(result);
        const fail = (err: unknown) => {
          removeStopButton();
          sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
        };

        // Generic name-based fill (live Meesho) when `fields` is provided.
        if (message.fields) {
          fillByName(message.fields).then(done).catch(fail);
          return true;
        }

        const map = SELECTOR_CONFIGS[message.config];
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
