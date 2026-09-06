import { useMemo, useState } from "react";
import { computeCost, resolveRuleSet, type CostInputs } from "@neo/rules-engine";
import { ToolPageLayout } from "../../components/tools/ToolPageLayout";

const money = (n: number) => `₹${n.toFixed(2)}`;

const inputClass =
  "w-full rounded-lg border-2 border-black px-3 py-2 font-body text-sm outline-none focus:bg-[#fff8fb]";
const labelClass = "font-body text-xs font-semibold uppercase tracking-wide text-black/60";

// "" means "use the rule engine's default" — keep numeric fields as `number | ""`
// so a cleared input reverts to the placeholder default rather than becoming 0.
const num = (v: number | ""): number | undefined => (v === "" ? undefined : Number(v));
const pct = (v: number | ""): number | undefined => (v === "" ? undefined : Number(v) / 100);

export function ProfitCalculator() {
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [manufacturingCost, setManufacturingCost] = useState<number | "">("");
  const [commission, setCommission] = useState<number | "">("");
  const [returnRate, setReturnRate] = useState<number | "">("");
  const [shipping, setShipping] = useState<number | "">("");
  const [gst, setGst] = useState<number | "">("");
  const [packaging, setPackaging] = useState<number | "">("");
  const [fixedFee, setFixedFee] = useState<number | "">("");
  const [collection, setCollection] = useState<number | "">("");

  const rules = resolveRuleSet(new Date());

  const outcome = useMemo(() => {
    const price = num(sellingPrice);
    const cost = num(manufacturingCost);
    if (price === undefined || !(price > 0) || cost === undefined || !(cost >= 0)) return null;

    const inputs: CostInputs = {
      sellingPrice: price,
      manufacturingCost: cost,
      commissionRate: pct(commission),
      returnRate: pct(returnRate),
      shippingCharge: num(shipping),
      gstRate: pct(gst),
      packagingFee: num(packaging),
      fixedFee: num(fixedFee),
      collectionRate: pct(collection),
    };
    return computeCost(inputs, rules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellingPrice, manufacturingCost, commission, returnRate, shipping, gst, packaging, fixedFee, collection, rules]);

  const star = rules.categories.find((c) => c.category === "*") ?? rules.categories[0];
  const defaultShippingCharge = rules.shipping[0]?.charge ?? 0;

  const assumptions: { key: string; label: string }[] = [
    { key: "commissionRate", label: `Commission ${(star.commissionRate * 100).toFixed(0)}%` },
    { key: "shippingCharge", label: `Shipping ${money(defaultShippingCharge)}` },
    { key: "gstRate", label: `GST ${(star.gstRate * 100).toFixed(0)}%` },
    { key: "packagingFee", label: `Packaging ${money(rules.margin.packagingFee)}` },
    { key: "returnRate", label: `Return ${(star.defaultReturnRate * 100).toFixed(0)}%` },
    { key: "fixedFee", label: `Fixed fee ${money(star.fixedFee ?? 0)}` },
    { key: "collectionRate", label: `Collection ${((star.collectionRate ?? 0) * 100).toFixed(0)}%` },
  ];

  return (
    <ToolPageLayout
      title="Profit & Breakeven Calculator"
      intro="See what a listing actually nets you after GST, packaging, shipping, and expected returns — the same effective-dated cost model Neo's Price Manager uses. Marketplace-agnostic: no weight or category needed."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Selling price (₹)</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 499"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Manufacturing cost (₹)</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={manufacturingCost}
                onChange={(e) => setManufacturingCost(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 220"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Commission %</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={commission}
                onChange={(e) => setCommission(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${(star.commissionRate * 100).toFixed(0)}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Return %</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                max="99"
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${(star.defaultReturnRate * 100).toFixed(0)}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Shipping (₹)</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={shipping}
                onChange={(e) => setShipping(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${defaultShippingCharge}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>GST %</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={gst}
                onChange={(e) => setGst(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${(star.gstRate * 100).toFixed(0)}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Packaging fee (₹)</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={packaging}
                onChange={(e) => setPackaging(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${rules.margin.packagingFee}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Fixed fee (₹)</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${star.fixedFee ?? 0}`}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Collection %</span>
              <input
                className={inputClass}
                type="number"
                min="0"
                value={collection}
                onChange={(e) => setCollection(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={`${((star.collectionRate ?? 0) * 100).toFixed(0)}`}
              />
            </label>
          </div>

          {!outcome ? (
            <p className="mt-6 font-body text-sm text-black/60">
              Enter a selling price and manufacturing cost to see your profit.
            </p>
          ) : (
            <div className="mt-6">
              {outcome.netProfit > 0 ? (
                <div className="rounded-xl border-2 border-black bg-[#b2ff59] px-4 py-3 font-body text-base font-semibold">
                  ✓ You keep {money(outcome.netProfit)} per sale
                </div>
              ) : (
                <div className="rounded-xl border-2 border-black bg-[#ff6b6b] px-4 py-3 font-body text-base font-semibold">
                  ⚠ Losing {money(Math.abs(outcome.netProfit))} — raise price above {money(outcome.breakeven)}
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border-2 border-black px-4 py-3">
                  <div className="font-body text-xs uppercase tracking-wide text-black/60">Margin</div>
                  <div className="font-body text-2xl font-bold">{outcome.marginPct.toFixed(1)}%</div>
                </div>
                <div className="rounded-xl border-2 border-black px-4 py-3">
                  <div className="font-body text-xs uppercase tracking-wide text-black/60">Breakeven</div>
                  <div className="font-body text-2xl font-bold">{money(outcome.breakeven)}</div>
                </div>
              </div>

              <div className="mt-6 border-t-2 border-black/10 pt-4">
                <h2 className="font-accent text-base text-black">Cost breakdown</h2>
                <ul className="mt-2 flex flex-col gap-1.5 font-body text-sm">
                  {outcome.lines.map((line) => (
                    <li key={line.label} className="flex items-center justify-between">
                      <span className={line.kind === "info" ? "text-black/50" : "text-black/80"}>{line.label}</span>
                      <span className={line.kind === "info" ? "text-black/50" : "font-semibold"}>
                        {line.kind === "cost" ? "−" : ""}
                        {money(line.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 font-body text-xs italic text-black/50">
                TCS 0.5% / TDS 0.1% are withheld but reclaimable — not counted as cost.
              </p>
            </div>
          )}
        </div>

        <div className="sm:col-span-1">
          <div className="sticky top-4 rounded-xl border-2 border-black bg-[#fff8fb] px-4 py-3">
            <h2 className="font-accent text-base text-black">Assumptions</h2>
            <p className="mt-1 font-body text-xs text-black/50">
              Blank fields fall back to these defaults. Highlighted = in use.
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 font-body text-sm">
              {assumptions.map((a) => {
                const active = outcome?.defaultsUsed.includes(a.key) ?? true;
                return (
                  <li
                    key={a.key}
                    className={active ? "rounded bg-[#b2ff59]/60 px-1.5 py-0.5 font-semibold" : "px-1.5 py-0.5 text-black/60"}
                  >
                    {a.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
