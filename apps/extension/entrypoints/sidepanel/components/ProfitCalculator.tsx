import React, { useMemo, useState } from "react";
import { resolveRuleSet } from "@neo/rules-engine";
import { calcProfit } from "../lib/calcProfit";

const money = (n: number) => `₹${n.toFixed(2)}`;

// Derived from the effective-dated RuleSet so options can't drift from the rules.
const CATEGORY_OPTIONS = resolveRuleSet(new Date()).categories.map((c) => ({
  value: c.category,
  label: c.category === "*" ? "Other" : c.category,
}));

const inputClass = "rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

export function ProfitCalculator() {
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [costPrice, setCostPrice] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">(0.5);
  const [category, setCategory] = useState("*");
  const [returnRatePercent, setReturnRatePercent] = useState<number | "">("");

  const outcome = useMemo(
    () =>
      calcProfit({
        sellingPrice: sellingPrice === "" ? NaN : Number(sellingPrice),
        costPrice: costPrice === "" ? NaN : Number(costPrice),
        weightKg: weightKg === "" ? NaN : Number(weightKg),
        category,
        returnRatePercent: returnRatePercent === "" ? undefined : Number(returnRatePercent),
      }),
    [sellingPrice, costPrice, weightKg, category, returnRatePercent]
  );
  const result = outcome.ok ? outcome.result : null;
  const returnRateInvalid = !outcome.ok && outcome.error.kind === "return-rate-too-high";

  return (
    <div className="p-4">
      <h2 className="font-loud text-2xl tracking-wide text-black">Profit Calculator</h2>

      <div className="mt-3 grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <input
          className={inputClass}
          type="number"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Selling price (₹)"
        />
        <input
          className={inputClass}
          type="number"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Cost price (₹)"
        />
        <input
          className={inputClass}
          type="number"
          step="0.1"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Weight (kg)"
        />
        <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          type="number"
          value={returnRatePercent}
          onChange={(e) => setReturnRatePercent(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Return rate % (optional, category default used if blank)"
        />
      </div>

      {result == null ? (
        <p className="mt-3 font-cartoon text-xs text-black/60">
          {returnRateInvalid
            ? "Return rate must be under 95%."
            : "Enter a selling price, cost price, and weight to see profit."}
        </p>
      ) : (
        <div className="mt-3 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
          {result.profit > 0 ? (
            <div className="rounded-lg border-2 border-black bg-[#b2ff59] px-3 py-2 font-cartoon text-xs font-semibold">
              ✓ You keep {money(result.profit)} per sale
            </div>
          ) : (
            <div className="rounded-lg border-2 border-black bg-[#ff6b6b] px-3 py-2 font-cartoon text-xs font-semibold">
              ⚠ Losing {money(Math.abs(result.profit))} per sale — raise price above {money(result.breakeven)}
            </div>
          )}

          <div className="mt-2 grid grid-cols-2 gap-2 font-cartoon text-xs">
            <div className="rounded-lg border-2 border-black px-2 py-1.5">
              Margin<div className="font-semibold">{result.marginPct.toFixed(1)}%</div>
            </div>
            <div className="rounded-lg border-2 border-black px-2 py-1.5">
              Breakeven<div className="font-semibold">{money(result.breakeven)}</div>
            </div>
          </div>

          <p className="mt-2 font-cartoon text-[11px] text-black/60">
            Uses Neo's effective-dated cost model (GST, packaging, shipping, returns) — the same math the Price
            Manager uses.
          </p>
        </div>
      )}
    </div>
  );
}
