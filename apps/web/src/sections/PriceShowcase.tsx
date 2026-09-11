import { useMemo, useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { PopButton } from "@neo/ui";
import { computeCost, computeProposedPrice, type RuleSet, type SkuCosting } from "@neo/rules-engine";
import { PRICE_ROWS, type PriceRow } from "../data";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

// Marketing count used in the copy to signal "bulk" — the table below shows a
// live sample of 13 real SKUs; the rule conceptually hits all 500.
const TOTAL_SKUS = 500;
const GST_RATES = [0, 5, 12, 18] as const;
// The landing-page preview explains the direct seller calculation only:
// selling price minus manufacturing cost. Marketplace fees belong in the
// detailed calculator, not in this simple price-floor demonstration.
const SELLER_COST_RULES: RuleSet = {
  effectiveFrom: "2024-01-01",
  margin: { packagingFee: 0, returnShippingCost: 0, defectRate: 0, shippingGstRate: 0, feeGstRate: 0 },
  categories: [{ category: "*", gstRate: 0, defaultReturnRate: 0, commissionRate: 0 }],
  shipping: [{ maxWeightKg: Infinity, charge: 0 }],
};

interface Settings {
  discount: number; // % off the current base price
  gst: number; // product GST %, fed into the engine as a cost input — never added on top
  roundCharm: boolean; // round each price to a customer-appeal charm price (₹__99 / ₹_9 / ₹9)
  floorBE: boolean; // floor the proposed price at break-even
}

const INITIAL_SETTINGS: Settings = { discount: 0, gst: 0, roundCharm: false, floorBE: true };

// A demo row's manufacturing cost, derived from its listed margin off the
// *original* list price — a stable number that doesn't move as `base` moves,
// so repeated Apply cycles don't drift the implied cost.
// Builds the SkuCosting the engine needs to price this row from its current
// committed base — never from the original list price, so a discount always
// applies to what's live right now, not to some stale reference point.
function skuFrom(row: PriceRow, base: number): SkuCosting {
  return {
    sku: row.sku,
    currentPrice: base,
    baseCost: row.costPrice,
    weightKg: 0.5,
    category: "*",
  };
}

function initialBases(): Record<string, number> {
  const bases: Record<string, number> = {};
  for (const row of PRICE_ROWS) bases[row.sku] = row.oldPrice;
  return bases;
}

export function PriceShowcase() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [bases, setBases] = useState<Record<string, number>>(initialBases);
  const [undoStack, setUndoStack] = useState<Record<string, number>[]>([]);
  const [justApplied, setJustApplied] = useState(false);

  const rows = useMemo(
    () =>
      PRICE_ROWS.map((row) => {
        const base = bases[row.sku] ?? row.oldPrice;
        const preview = Math.round(
          computeProposedPrice(
            {
              actionType: "PERCENTAGE_DISCOUNT",
              actionValue: settings.discount,
              roundToCharm: settings.roundCharm,
              floorBreakeven: settings.floorBE,
            },
            skuFrom(row, base),
            SELLER_COST_RULES,
          ),
        );
        const { netProfit, gstComponent, marginPct } = computeCost(
          { sellingPrice: preview, manufacturingCost: row.costPrice, gstRate: settings.gst / 100 },
          SELLER_COST_RULES,
        );
        return {
          sku: row.sku,
          name: row.name,
          margin: Math.round(marginPct),
          base,
          costPrice: row.costPrice,
          preview,
          changed: preview !== base,
          netProfit,
          gstComponent,
        };
      }),
    [settings, bases],
  );

  const pendingChange = settings.discount > 0;
  const lossCount = rows.filter((r) => r.netProfit < 0).length;
  // Average GST embedded in the proposed prices — what you remit / claim as
  // ITC per order, straight from computeCost. Never added on top of the
  // displayed price; purely an info figure driven by the GST buttons.
  const avgGstToRemit = Math.round(rows.reduce((sum, r) => sum + r.gstComponent, 0) / rows.length);

  function apply() {
    setUndoStack((stack) => [...stack, bases]);
    const nextBases: Record<string, number> = {};
    for (const row of rows) nextBases[row.sku] = row.preview;
    setBases(nextBases);
    setSettings((s) => ({ ...s, discount: 0 }));
    setJustApplied(true);
  }
  function undo() {
    if (undoStack.length === 0) return;
    const prevBases = undoStack[undoStack.length - 1];
    setBases(prevBases);
    setUndoStack(undoStack.slice(0, -1));
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
              <table className="w-full min-w-[680px] border-collapse font-body text-sm">
                <thead>
                  <tr className="border-b-2 border-black text-left">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Cost price</th>
                    <th className="px-3 py-2">Selling price</th>
                    <th className="px-3 py-2">Margin</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.sku} className="border-b border-black/15">
                      <td className="px-3 py-2.5 font-bold">{row.sku}</td>
                      <td className="px-3 py-2.5">
                        {row.name}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        <span className="font-bold text-black">₹{row.costPrice}</span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        <span className={`font-bold ${row.changed ? "text-[#ff2fb0]" : "text-black"}`}>₹{row.preview}</span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{row.margin}%</td>
                      <td className="px-3 py-2.5 tabular-nums">
                        {row.netProfit >= 0 ? (
                          <span className="font-bold text-green-600">+₹{Math.round(row.netProfit)}</span>
                        ) : (
                          <span className="font-bold text-red-600">−₹{Math.round(Math.abs(row.netProfit))}</span>
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
                  checked={settings.roundCharm}
                  onChange={(e) => update({ roundCharm: e.target.checked })}
                  className="h-4 w-4 accent-[#ff2fb0]"
                />
                Round Off Charm
              </label>
              <label className="flex cursor-pointer items-center gap-2 border border-black/40 bg-[#fff0f5] px-4 py-2.5 font-body text-sm font-bold text-black">
                <input
                  type="checkbox"
                  checked={settings.floorBE}
                  onChange={(e) => update({ floorBE: e.target.checked })}
                  className="h-4 w-4 accent-[#ff2fb0]"
                />
                Floor at break-even
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
                    {lossCount > 0 && <span className="font-bold text-red-500"> · {lossCount} at a loss</span>}
                  </>
                ) : (
                  <span>Live prices are up to date.</span>
                )}
              </p>
              <div className="flex flex-col gap-3">
                <PopButton text="Apply" color="#b2ff59" icon={Check} onClick={apply} disabled={!pendingChange} />
                <PopButton
                  text="Previous (undo)"
                  color="#ffffff"
                  icon={Undo2}
                  onClick={undo}
                  disabled={undoStack.length === 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionBg>
  );
}
