import { useMemo, useState } from "react";
import { computeMargin, computeBreakeven, resolveRuleSet, type SkuCosting } from "@neo/rules-engine";
import { ToolPageLayout } from "../../components/tools/ToolPageLayout";

// Return rate must stay strictly below 100% for the margin formulas' (1 - returnRate)
// denominator to stay positive; cap well under that so results stay sane. Mirrors the
// extension side panel's calcProfit guard (apps/extension .../lib/calcProfit.ts).
const MAX_RETURN_RATE_PERCENT = 95;

const CATEGORY_OPTIONS = resolveRuleSet(new Date()).categories.map((c) => ({
  value: c.category,
  label: c.category === "*" ? "Other" : c.category,
}));

const money = (n: number) => `₹${n.toFixed(2)}`;

const inputClass =
  "w-full rounded-lg border-2 border-black px-3 py-2 font-body text-sm outline-none focus:bg-[#fff8fb]";
const labelClass = "font-body text-xs font-semibold uppercase tracking-wide text-black/60";

export function ProfitCalculator() {
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">(0.5);
  const [category, setCategory] = useState("*");
  const [returnRatePercent, setReturnRatePercent] = useState<number | "">("");

  const outcome = useMemo(() => {
    const price = sellingPrice === "" ? NaN : Number(sellingPrice);
    const cost = costPrice === "" ? NaN : Number(costPrice);
    const weight = weightKg === "" ? NaN : Number(weightKg);
    const returnPct = returnRatePercent === "" ? undefined : Number(returnRatePercent);

    if (!Number.isFinite(price) || price <= 0) return { ok: false as const, reason: "incomplete" as const };
    if (!Number.isFinite(cost) || cost < 0) return { ok: false as const, reason: "incomplete" as const };
    if (!Number.isFinite(weight) || weight <= 0) return { ok: false as const, reason: "incomplete" as const };
    if (returnPct != null && Number.isFinite(returnPct) && returnPct >= MAX_RETURN_RATE_PERCENT) {
      return { ok: false as const, reason: "return-rate-too-high" as const };
    }

    const rules = resolveRuleSet(new Date());
    const sku: SkuCosting = {
      sku: "web-calc",
      currentPrice: price,
      baseCost: cost,
      weightKg: weight,
      category,
      returnRate: returnPct != null && Number.isFinite(returnPct) ? returnPct / 100 : undefined,
    };

    const profit = computeMargin(sku, price, rules);
    const marginPct = (profit / price) * 100;
    const breakeven = computeBreakeven(sku, rules);

    if (!Number.isFinite(profit) || !Number.isFinite(marginPct) || !Number.isFinite(breakeven)) {
      return { ok: false as const, reason: "return-rate-too-high" as const };
    }

    return { ok: true as const, profit, marginPct, breakeven };
  }, [sellingPrice, costPrice, weightKg, category, returnRatePercent]);

  return (
    <ToolPageLayout
      title="Profit & Breakeven Calculator"
      intro="See what a listing actually nets you after GST, packaging, shipping, and expected returns — the same effective-dated cost model Neo's Price Manager uses."
    >
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
          <span className={labelClass}>Cost price (₹)</span>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 220"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Weight (kg)</span>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Category</span>
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className={labelClass}>Return rate % (optional — category default used if blank)</span>
          <input
            className={inputClass}
            type="number"
            min="0"
            max="99"
            value={returnRatePercent}
            onChange={(e) => setReturnRatePercent(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 15"
          />
        </label>
      </div>

      {!outcome.ok ? (
        <p className="mt-6 font-body text-sm text-black/60">
          {outcome.reason === "return-rate-too-high"
            ? `Return rate must be under ${MAX_RETURN_RATE_PERCENT}%.`
            : "Enter a selling price, cost price, and weight to see your profit."}
        </p>
      ) : (
        <div className="mt-6">
          {outcome.profit > 0 ? (
            <div className="rounded-xl border-2 border-black bg-[#b2ff59] px-4 py-3 font-body text-base font-semibold">
              ✓ You keep {money(outcome.profit)} per sale
            </div>
          ) : (
            <div className="rounded-xl border-2 border-black bg-[#ff6b6b] px-4 py-3 font-body text-base font-semibold">
              ⚠ Losing {money(Math.abs(outcome.profit))} per sale — raise price above {money(outcome.breakeven)}
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
        </div>
      )}
    </ToolPageLayout>
  );
}
