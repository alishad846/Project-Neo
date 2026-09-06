import { useMemo, useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { PopButton } from "@neo/ui";
import { computeCost, computeProposedPrice, resolveRuleSet, type RuleSet, type SkuCosting } from "@neo/rules-engine";
import { PRICE_ROWS } from "../data";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

// Marketing count used in the copy to signal "bulk" — the table below shows a
// live sample of 10 real SKUs; the rule conceptually hits all 500.
const TOTAL_SKUS = 500;
const GST_RATES = [0, 5, 12, 18] as const;

interface Settings {
  discount: number; // % off list price
  gst: number; // product GST %, fed into the engine as a cost input — never added on top
  round99: boolean; // round each price to ₹__99
}

const BASELINE: Settings = { discount: 0, gst: 0, round99: false };

// A demo row's manufacturing cost, derived the same way the old local `costOf`
// helper did (from its listed margin), so we can build a SkuCosting for it.
function skuFor(row: (typeof PRICE_ROWS)[number]): SkuCosting {
  return {
    sku: row.sku,
    currentPrice: row.oldPrice, // GST-inclusive list price — never modified by adding GST on top
    baseCost: Math.round(row.newPrice * (1 - row.margin / 100)),
    weightKg: 0.5,
    category: "*",
  };
}

// Runs a row through the real engine: proposed price is computed by
// computeProposedPrice (which clamps at breakeven and handles round-to-99),
// and margin/breakeven for display come from computeCost — no local pricing
// math. GST is passed in as a cost input only; it is never added on top of
// the displayed price, so a discount can never raise it.
function priceUnder(sku: SkuCosting, s: Settings, rules: RuleSet) {
  const listed = computeProposedPrice(
    { actionType: "PERCENTAGE_DISCOUNT", actionValue: s.discount, roundTo99: s.round99 },
    sku,
    rules,
  );
  const breakdown = computeCost({ sellingPrice: listed, manufacturingCost: sku.baseCost, gstRate: s.gst / 100 }, rules);
  return {
    listed: Math.round(listed),
    marginPct: Math.round(breakdown.marginPct),
    breakeven: breakdown.breakeven,
    gstComponent: breakdown.gstComponent,
  };
}
function settingsEqual(a: Settings, b: Settings) {
  return a.discount === b.discount && a.gst === b.gst && a.round99 === b.round99;
}

export function PriceShowcase() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  const [settings, setSettings] = useState<Settings>({ discount: 10, gst: 0, round99: false });
  const [applied, setApplied] = useState<Settings>(BASELINE);
  const [prev, setPrev] = useState<Settings | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  const rules = useMemo(() => resolveRuleSet(new Date()), []);

  const rows = useMemo(
    () =>
      PRICE_ROWS.map((row) => {
        const sku = skuFor(row);
        const now = priceUnder(sku, applied, rules);
        const next = priceUnder(sku, settings, rules);
        // The engine unconditionally floors at breakeven, so "floored" tells
        // us it clamped this row rather than applying the raw discounted price.
        const floored = next.listed <= next.breakeven + 0.5;
        return {
          sku: row.sku,
          name: row.name,
          oldListed: now.listed,
          newListed: next.listed,
          margin: next.marginPct,
          floored,
          changed: next.listed !== now.listed,
          gstComponent: next.gstComponent,
        };
      }),
    [settings, applied, rules],
  );

  const pendingChange = !settingsEqual(settings, applied);
  const flooredCount = rows.filter((r) => r.floored).length;
  // Average GST embedded in the proposed prices — what you remit / claim as
  // ITC per order, straight from computeCost. Never added on top of the
  // displayed price; purely an info figure driven by the GST buttons.
  const avgGstToRemit = Math.round(rows.reduce((sum, r) => sum + r.gstComponent, 0) / rows.length);

  function apply() {
    setPrev(applied);
    setApplied(settings);
    setJustApplied(true);
  }
  function undo() {
    if (!prev) return;
    setApplied(prev);
    setSettings(prev);
    setPrev(null);
    setJustApplied(false);
  }
  function update(patch: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...patch }));
    setJustApplied(false);
  }

  return (
    <SectionBg tone="light" className="comic-cream" contentClassName="relative z-10">
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-4 text-center font-loud text-3xl text-black heading-pop sm:text-5xl md:text-7xl">
          CHANGE {TOTAL_SKUS} PRICES. UNDO IN ONE CLICK.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center font-body text-lg text-black/75">
          Set a rule, watch every price update live, then apply it to all {TOTAL_SKUS} SKUs at once. Don&rsquo;t
          like it? Hit Previous.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* LEFT — live dry-run table (sample of the 500) */}
          <div className="border border-black/40 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)] md:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-loud text-2xl text-black">Dry-run preview</p>
              <span className="border border-black/30 bg-[#ffe680] px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-black">
                {TOTAL_SKUS} SKUs · live sample
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse font-body text-sm">
                <thead>
                  <tr className="border-b-2 border-black text-left">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Old → New</th>
                    <th className="px-3 py-2">Margin</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.sku} className="border-b border-black/15">
                      <td className="px-3 py-2.5 font-bold">{row.sku}</td>
                      <td className="px-3 py-2.5">{row.name}</td>
                      <td className="px-3 py-2.5 tabular-nums">
                        <span className="text-black/40 line-through">₹{row.oldListed}</span>{" "}
                        <span className="text-black">→</span>{" "}
                        <span className={`font-bold ${row.changed ? "text-[#ff2fb0]" : "text-black"}`}>
                          ₹{row.newListed}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{row.margin}%</td>
                      <td className="px-3 py-2.5">
                        {!row.floored ? (
                          <span className="border border-black/40 bg-[#b2ff59] px-2.5 py-1 text-xs font-bold uppercase">
                            safe
                          </span>
                        ) : (
                          <span className="border border-black/40 bg-red-400 px-2.5 py-1 text-xs font-bold uppercase">
                            floored
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — rule controls, then immersive Apply / Undo */}
          <div className="flex flex-col gap-5">
            <div className="border border-black/40 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)]">
              <p className="mb-5 font-loud text-2xl text-black">Your rule</p>

              <label className="mb-5 block">
                <span className="mb-2 flex items-center justify-between font-body text-sm font-bold uppercase tracking-wide text-black/70">
                  <span>Discount</span>
                  <span className="font-loud text-2xl text-[#ff2fb0]">{settings.discount}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.discount}
                  onChange={(e) => update({ discount: Number(e.target.value) })}
                  aria-label="Discount percentage"
                  className="h-3 w-full cursor-pointer appearance-none border border-black/40 bg-[#ffe680] accent-[#ff2fb0]"
                />
              </label>

              <div className="mb-5">
                <span className="mb-2 block font-body text-sm font-bold uppercase tracking-wide text-black/70">
                  GST / tax
                </span>
                <div className="flex gap-2">
                  {GST_RATES.map((g) => (
                    <button
                      key={g}
                      onClick={() => update({ gst: g })}
                      className={`flex-1 border border-black/40 px-2 py-2 font-body text-sm font-bold shadow-[2px_2px_0px_0px_rgba(26,22,15,0.85)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                        settings.gst === g ? "bg-[#00e5ff]" : "bg-white"
                      }`}
                    >
                      {g}%
                    </button>
                  ))}
                </div>
                <p className="mt-2 font-body text-xs text-black/60">
                  GST doesn&rsquo;t change the buyer&rsquo;s price — it&rsquo;s baked in either way. It changes what
                  you remit: ≈ <span className="font-bold text-black">₹{avgGstToRemit}</span> per order to collect /
                  claim as ITC.
                </p>
              </div>

              <label className="mb-3 flex cursor-pointer items-center gap-2 border border-black/40 bg-[#fff0f5] px-4 py-2.5 font-body text-sm font-bold text-black">
                <input
                  type="checkbox"
                  checked={settings.round99}
                  onChange={(e) => update({ round99: e.target.checked })}
                  className="h-4 w-4 accent-[#ff2fb0]"
                />
                Round to ₹__99
              </label>
              <label className="flex cursor-not-allowed items-center gap-2 border border-black/40 bg-[#fff0f5] px-4 py-2.5 font-body text-sm font-bold text-black/70">
                <input type="checkbox" checked disabled className="h-4 w-4 accent-[#ff2fb0]" />
                Floor at break-even <span className="font-normal text-black/50">— always on, can&rsquo;t be turned off</span>
              </label>
            </div>

            {/* Status + immersive Apply / Undo */}
            <div className="border border-black/40 bg-white p-5 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)]">
              <p className="mb-4 font-body text-sm text-black/70">
                {justApplied ? (
                  <span className="font-bold text-black">✓ Applied to all {TOTAL_SKUS} SKUs — reversible.</span>
                ) : pendingChange ? (
                  <>
                    Pending: <span className="font-bold text-[#ff2fb0]">{settings.discount}% off</span> on{" "}
                    {TOTAL_SKUS} SKUs
                    {flooredCount > 0 && <span className="font-bold text-red-500"> · {flooredCount} floored</span>}
                  </>
                ) : (
                  <span>Live prices are up to date.</span>
                )}
              </p>
              <div className="flex flex-col gap-3">
                <PopButton text="Apply to 500" color="#b2ff59" icon={Check} onClick={apply} disabled={!pendingChange} />
                <PopButton text="Previous (undo)" color="#ffffff" icon={Undo2} onClick={undo} disabled={!prev} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionBg>
  );
}
