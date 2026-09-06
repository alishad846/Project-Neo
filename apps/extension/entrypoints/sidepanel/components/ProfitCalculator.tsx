import { useMemo, useState } from "react";
import { resolveRuleSet } from "@neo/rules-engine";
import { calcProfit } from "../lib/calcProfit";

const money = (n: number) => `₹${n.toFixed(2)}`;

const inputClass = "rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

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
  const star = rules.categories.find((c) => c.category === "*") ?? rules.categories[0] ?? {
    category: "*",
    commissionRate: 0,
    gstRate: 0,
    defaultReturnRate: 0,
    fixedFee: 0,
    collectionRate: 0,
  };
  const defaultShippingCharge = rules.shipping[0]?.charge ?? 0;

  const outcome = useMemo(
    () =>
      calcProfit({
        sellingPrice: sellingPrice === "" ? NaN : Number(sellingPrice),
        manufacturingCost: manufacturingCost === "" ? NaN : Number(manufacturingCost),
        commissionRate: pct(commission),
        returnRate: pct(returnRate),
        shippingCharge: num(shipping),
        gstRate: pct(gst),
        packagingFee: num(packaging),
        fixedFee: num(fixedFee),
        collectionRate: pct(collection),
      }),
    [sellingPrice, manufacturingCost, commission, returnRate, shipping, gst, packaging, fixedFee, collection]
  );
  const result = outcome.ok ? outcome.result : null;

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
    <div className="p-4">
      <h2 className="font-accent text-xl tracking-wide text-black">Profit Calculator</h2>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <input
          className={`${inputClass} col-span-2`}
          type="number"
          min="0"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Selling price (₹)"
        />
        <input
          className={`${inputClass} col-span-2`}
          type="number"
          min="0"
          value={manufacturingCost}
          onChange={(e) => setManufacturingCost(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Manufacturing cost (₹)"
        />
        <input
          className={inputClass}
          type="number"
          min="0"
          value={commission}
          onChange={(e) => setCommission(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Commission % (${(star.commissionRate * 100).toFixed(0)})`}
        />
        <input
          className={inputClass}
          type="number"
          min="0"
          max="99"
          value={returnRate}
          onChange={(e) => setReturnRate(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Return % (${(star.defaultReturnRate * 100).toFixed(0)})`}
        />
        <input
          className={inputClass}
          type="number"
          min="0"
          value={shipping}
          onChange={(e) => setShipping(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Shipping ₹ (${defaultShippingCharge})`}
        />
        <input
          className={inputClass}
          type="number"
          min="0"
          value={gst}
          onChange={(e) => setGst(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`GST % (${(star.gstRate * 100).toFixed(0)})`}
        />
        <input
          className={inputClass}
          type="number"
          min="0"
          value={packaging}
          onChange={(e) => setPackaging(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Packaging ₹ (${rules.margin.packagingFee})`}
        />
        <input
          className={inputClass}
          type="number"
          min="0"
          value={fixedFee}
          onChange={(e) => setFixedFee(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Fixed fee ₹ (${star.fixedFee ?? 0})`}
        />
        <input
          className={`${inputClass} col-span-2`}
          type="number"
          min="0"
          value={collection}
          onChange={(e) => setCollection(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={`Collection % (${((star.collectionRate ?? 0) * 100).toFixed(0)})`}
        />
      </div>

      {result == null ? (
        <p className="mt-3 font-cartoon text-xs text-black/60">
          Enter a selling price and manufacturing cost to see your profit.
        </p>
      ) : (
        <div className="mt-3 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
          {result.netProfit > 0 ? (
            <div className="rounded-lg border-2 border-black bg-[#b2ff59] px-3 py-2 font-cartoon text-xs font-semibold">
              ✓ You keep {money(result.netProfit)} per sale
            </div>
          ) : (
            <div className="rounded-lg border-2 border-black bg-[#ff6b6b] px-3 py-2 font-cartoon text-xs font-semibold">
              ⚠ Losing {money(Math.abs(result.netProfit))} — raise price above {money(result.breakeven)}
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

          <div className="mt-2 border-t-2 border-black/10 pt-2">
            <h3 className="font-accent text-sm text-black">Cost breakdown</h3>
            <ul className="mt-1 flex flex-col gap-1 font-cartoon text-[11px]">
              {result.lines.map((line) => (
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

          <p className="mt-2 font-cartoon text-[10px] italic text-black/50">
            TCS 0.5% / TDS 0.1% are withheld but reclaimable — not counted as cost.
          </p>
        </div>
      )}

      <details className="mt-3 rounded-xl border-2 border-black bg-[#fff8fb] p-3 font-cartoon text-xs">
        <summary className="cursor-pointer font-accent text-sm text-black">Assumptions</summary>
        <p className="mt-1 text-[11px] text-black/50">Blank fields fall back to these defaults. Highlighted = in use.</p>
        <ul className="mt-2 flex flex-col gap-1">
          {assumptions.map((a) => {
            const active = result == null ? true : outcome.ok && outcome.result.defaultsUsed.includes(a.key);
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
      </details>
    </div>
  );
}
