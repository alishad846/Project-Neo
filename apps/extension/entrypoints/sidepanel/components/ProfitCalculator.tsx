import { useMemo, useState } from "react";
import { resolveRuleSet } from "@neo/rules-engine";
import { calcProfit } from "../lib/calcProfit";

const money = (n: number) => `₹${n.toFixed(2)}`;

const inputClass =
  "rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs disabled:cursor-not-allowed disabled:border-black/20 disabled:bg-black/5 disabled:text-black/40 placeholder:text-black/30";

// "" means "use the rule engine's default" — keep numeric fields as `number | ""`
// so a cleared input reverts to the placeholder default rather than becoming 0.
type NumOrBlank = number | "";
const num = (v: NumOrBlank): number | undefined => (v === "" ? undefined : Number(v));
const pct = (v: NumOrBlank): number | undefined => (v === "" ? undefined : Number(v) / 100);

// Three-state build for one optional factor: OFF -> 0 (contributes nothing),
// ON + blank -> undefined (engine falls back to the RuleSet default), ON + value -> Number(value).
function buildFactor(on: boolean, value: NumOrBlank, convert: (v: NumOrBlank) => number | undefined): number | undefined {
  if (!on) return 0;
  return convert(value);
}

type FactorKey = "commission" | "return" | "shipping" | "gst" | "packaging" | "fixedFee" | "collection";

// Maps each optional factor to the CostLine.key(s) it should reveal in the breakdown.
const FACTOR_LINE_KEYS: Record<FactorKey, string[]> = {
  commission: ["commission"],
  return: ["returns"],
  shipping: ["shipping"],
  gst: ["gstInfo"],
  packaging: ["packaging"],
  fixedFee: ["fixedFee"],
  collection: ["collection"],
};

export function ProfitCalculator() {
  const [sellingPrice, setSellingPrice] = useState<NumOrBlank>("");
  const [manufacturingCost, setManufacturingCost] = useState<NumOrBlank>("");

  const [commissionOn, setCommissionOn] = useState(false);
  const [commission, setCommission] = useState<NumOrBlank>("");
  const [returnOn, setReturnOn] = useState(false);
  const [returnRate, setReturnRate] = useState<NumOrBlank>("");
  const [shippingOn, setShippingOn] = useState(false);
  const [shipping, setShipping] = useState<NumOrBlank>("");
  const [gstOn, setGstOn] = useState(false);
  const [gst, setGst] = useState<NumOrBlank>("");
  const [packagingOn, setPackagingOn] = useState(false);
  const [packaging, setPackaging] = useState<NumOrBlank>("");
  const [fixedFeeOn, setFixedFeeOn] = useState(false);
  const [fixedFee, setFixedFee] = useState<NumOrBlank>("");
  const [collectionOn, setCollectionOn] = useState(false);
  const [collection, setCollection] = useState<NumOrBlank>("");

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
        commissionRate: buildFactor(commissionOn, commission, pct),
        returnRate: buildFactor(returnOn, returnRate, pct),
        shippingCharge: buildFactor(shippingOn, shipping, num),
        gstRate: buildFactor(gstOn, gst, pct),
        packagingFee: buildFactor(packagingOn, packaging, num),
        fixedFee: buildFactor(fixedFeeOn, fixedFee, num),
        collectionRate: buildFactor(collectionOn, collection, pct),
      }),
    [
      sellingPrice,
      manufacturingCost,
      commissionOn,
      commission,
      returnOn,
      returnRate,
      shippingOn,
      shipping,
      gstOn,
      gst,
      packagingOn,
      packaging,
      fixedFeeOn,
      fixedFee,
      collectionOn,
      collection,
    ]
  );
  const result = outcome.ok ? outcome.result : null;

  // A breakdown line is shown only when the factor that produces it is switched on.
  // "manufacturing" is always shown (it's a required input, not an optional factor).
  // "feeGst" (GST charged on top of %-fees/fixed-fee/shipping) shows if any fee-bearing factor is on.
  const activeFactors: FactorKey[] = [
    ...(commissionOn ? (["commission"] as const) : []),
    ...(returnOn ? (["return"] as const) : []),
    ...(shippingOn ? (["shipping"] as const) : []),
    ...(gstOn ? (["gst"] as const) : []),
    ...(packagingOn ? (["packaging"] as const) : []),
    ...(fixedFeeOn ? (["fixedFee"] as const) : []),
    ...(collectionOn ? (["collection"] as const) : []),
  ];
  const visibleKeys = new Set<string>(["manufacturing", ...activeFactors.flatMap((f) => FACTOR_LINE_KEYS[f])]);
  if (commissionOn || collectionOn || fixedFeeOn || shippingOn) visibleKeys.add("feeGst");

  const visibleLines = result?.lines.filter((line) => visibleKeys.has(line.key)) ?? [];

  const factorRows: {
    key: FactorKey;
    label: string;
    on: boolean;
    setOn: (v: boolean) => void;
    value: NumOrBlank;
    setValue: (v: NumOrBlank) => void;
    placeholder: string;
    definition: string;
  }[] = [
    {
      key: "commission",
      label: "Commission %",
      on: commissionOn,
      setOn: setCommissionOn,
      value: commission,
      setValue: setCommission,
      placeholder: `${(star.commissionRate * 100).toFixed(0)}`,
      definition:
        "% of the selling price the marketplace keeps per order (Meesho 0%, Flipkart 3–22%, Amazon 5–17%).",
    },
    {
      key: "fixedFee",
      label: "Fixed fee (₹)",
      on: fixedFeeOn,
      setOn: setFixedFeeOn,
      value: fixedFee,
      setValue: setFixedFee,
      placeholder: `${star.fixedFee ?? 0}`,
      definition: "Flat ₹/order regardless of price (Amazon closing, Flipkart fixed; Meesho none).",
    },
    {
      key: "collection",
      label: "Collection %",
      on: collectionOn,
      setOn: setCollectionOn,
      value: collection,
      setValue: setCollection,
      placeholder: `${((star.collectionRate ?? 0) * 100).toFixed(0)}`,
      definition: "Payment-handling % to collect the buyer's money (Flipkart ~2% prepaid).",
    },
    {
      key: "shipping",
      label: "Shipping (₹)",
      on: shippingOn,
      setOn: setShippingOn,
      value: shipping,
      setValue: setShipping,
      placeholder: `${defaultShippingCharge}`,
      definition: "Forward logistics cost per order.",
    },
    {
      key: "packaging",
      label: "Packaging fee (₹)",
      on: packagingOn,
      setOn: setPackagingOn,
      value: packaging,
      setValue: setPackaging,
      placeholder: `${rules.margin.packagingFee}`,
      definition: "Cost to pack one order.",
    },
    {
      key: "return",
      label: "Return %",
      on: returnOn,
      setOn: setReturnOn,
      value: returnRate,
      setValue: setReturnRate,
      placeholder: `${(star.defaultReturnRate * 100).toFixed(0)}`,
      definition: "Expected share of orders returned; each costs return-shipping + a resale-loss chance.",
    },
    {
      key: "gst",
      label: "GST %",
      on: gstOn,
      setOn: setGstOn,
      value: gst,
      setValue: setGst,
      placeholder: `${(star.gstRate * 100).toFixed(0)}`,
      definition:
        "GST rate on your product; the GST baked into your price you collect & remit (claimable ITC); info, not a deduction.",
    },
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
      </div>

      <div className="mt-3">
        <h3 className="font-accent text-sm text-black">Optional factors</h3>
        <p className="mt-1 font-cartoon text-[10px] text-black/50">
          Off by default. Switch on, then leave blank for Neo's default or enter your own number.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          {factorRows.map((row) => (
            <div
              key={row.key}
              className={`rounded-lg border-2 px-2 py-1.5 ${row.on ? "border-black bg-white" : "border-black/20 bg-black/5"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-black"
                    checked={row.on}
                    onChange={(e) => row.setOn(e.target.checked)}
                  />
                  <span
                    className={`font-cartoon text-[11px] ${row.on ? "font-semibold text-black" : "text-black/50"}`}
                  >
                    {row.label}
                  </span>
                </label>
                <input
                  className={`${inputClass} w-16 py-1 text-right`}
                  type="number"
                  min="0"
                  disabled={!row.on}
                  value={row.value}
                  onChange={(e) => row.setValue(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder={row.placeholder}
                  title={row.definition}
                />
              </div>
              <p className={`mt-1 font-cartoon text-[10px] ${row.on ? "text-black/60" : "text-black/35"}`}>
                {row.definition}
              </p>
            </div>
          ))}
        </div>
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
              {visibleLines.map((line) => (
                <li key={line.key} className="flex items-center justify-between">
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
    </div>
  );
}
