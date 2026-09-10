import { useMemo, useState } from "react";
import { computeCost, resolveRuleSet, type CostInputs } from "@neo/rules-engine";
import { ToolPageLayout } from "../../components/tools/ToolPageLayout";

const money = (n: number) => `₹${n.toFixed(2)}`;

const inputClass =
  "w-full rounded-lg border-2 border-black px-3 py-2 font-body text-sm outline-none focus:bg-[#fff8fb] disabled:cursor-not-allowed disabled:border-black/20 disabled:bg-black/5 disabled:text-black/40 placeholder:text-black/30 placeholder-black/30";
const labelClass = "font-body text-xs font-semibold uppercase tracking-wide text-black/60";

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
  const star = rules.categories.find((c) => c.category === "*") ?? rules.categories[0];
  const defaultShippingCharge = rules.shipping[0]?.charge ?? 0;

  const outcome = useMemo(() => {
    const price = num(sellingPrice);
    const cost = num(manufacturingCost);
    if (price === undefined || !(price > 0) || cost === undefined || !(cost >= 0)) return null;

    const inputs: CostInputs = {
      sellingPrice: price,
      manufacturingCost: cost,
      commissionRate: buildFactor(commissionOn, commission, pct),
      returnRate: buildFactor(returnOn, returnRate, pct),
      shippingCharge: buildFactor(shippingOn, shipping, num),
      gstRate: buildFactor(gstOn, gst, pct),
      packagingFee: buildFactor(packagingOn, packaging, num),
      fixedFee: buildFactor(fixedFeeOn, fixedFee, num),
      collectionRate: buildFactor(collectionOn, collection, pct),
    };
    return computeCost(inputs, rules);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
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
    rules,
  ]);

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

  const visibleLines = outcome?.lines.filter((line) => visibleKeys.has(line.key)) ?? [];

  const factorRows: {
    key: FactorKey;
    label: string;
    unit: "%" | "₹";
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
      unit: "%",
      on: commissionOn,
      setOn: setCommissionOn,
      value: commission,
      setValue: setCommission,
      placeholder: `${(star.commissionRate * 100).toFixed(0)}`,
      definition:
        "The % of the selling price the marketplace keeps on every order (Meesho 0%, Flipkart 3–22%, Amazon 5–17%).",
    },
    {
      key: "fixedFee",
      label: "Fixed fee (₹)",
      unit: "₹",
      on: fixedFeeOn,
      setOn: setFixedFeeOn,
      value: fixedFee,
      setValue: setFixedFee,
      placeholder: `${star.fixedFee ?? 0}`,
      definition:
        'A flat ₹ charge per order regardless of price (Amazon "closing fee", Flipkart "fixed fee"). Meesho: none.',
    },
    {
      key: "collection",
      label: "Collection %",
      unit: "%",
      on: collectionOn,
      setOn: setCollectionOn,
      value: collection,
      setValue: setCollection,
      placeholder: `${((star.collectionRate ?? 0) * 100).toFixed(0)}`,
      definition: "A payment-handling % the marketplace charges to collect the buyer's money (e.g. Flipkart ~2% on prepaid).",
    },
    {
      key: "shipping",
      label: "Shipping (₹)",
      unit: "₹",
      on: shippingOn,
      setOn: setShippingOn,
      value: shipping,
      setValue: setShipping,
      placeholder: `${defaultShippingCharge}`,
      definition: "Forward logistics cost to deliver one order.",
    },
    {
      key: "packaging",
      label: "Packaging fee (₹)",
      unit: "₹",
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
      unit: "%",
      on: returnOn,
      setOn: setReturnOn,
      value: returnRate,
      setValue: setReturnRate,
      placeholder: `${(star.defaultReturnRate * 100).toFixed(0)}`,
      definition: "Expected share of orders returned; each return costs return-shipping plus a chance the item can't be resold.",
    },
    {
      key: "gst",
      label: "GST %",
      unit: "%",
      on: gstOn,
      setOn: setGstOn,
      value: gst,
      setValue: setGst,
      placeholder: `${(star.gstRate * 100).toFixed(0)}`,
      definition:
        "GST rate on your product; the GST portion baked into your price that you collect and remit (claimable as input credit). Info, not a profit deduction.",
    },
  ];

  return (
    <ToolPageLayout
      title="Profit & Breakeven Calculator"
      intro="See what a listing actually nets you after GST, packaging, shipping, and expected returns — the same effective-dated cost model Neo's Price Manager uses. Marketplace-agnostic: no weight or category needed."
    >
      <div className="grid gap-6">
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
        </div>

        <div>
          <h2 className="font-accent text-base text-black">Optional factors</h2>
          <p className="mt-1 font-body text-xs text-black/50">
            Off by default. Switch one on, then leave it blank to use Neo's default or enter your own number.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {factorRows.map((row) => (
              <div
                key={row.key}
                className={`rounded-lg border-2 px-3 py-2.5 ${row.on ? "border-black bg-white" : "border-black/20 bg-black/5"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-black"
                      checked={row.on}
                      onChange={(e) => row.setOn(e.target.checked)}
                    />
                    <span className={row.on ? "font-body text-xs font-semibold uppercase tracking-wide text-black" : labelClass}>
                      {row.label}
                    </span>
                  </label>
                  <input
                    className={`${inputClass} w-24 py-1 text-right`}
                    type="number"
                    min="0"
                    disabled={!row.on}
                    value={row.value}
                    onChange={(e) => row.setValue(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={row.placeholder}
                  />
                </div>
                <p className={`mt-1.5 font-body text-xs ${row.on ? "text-black/60" : "text-black/40"}`}>{row.definition}</p>
              </div>
            ))}
          </div>
        </div>

        {!outcome ? (
          <p className="font-body text-sm text-black/60">Enter a selling price and manufacturing cost to see your profit.</p>
        ) : (
          <div>
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

            <p className="mt-4 font-body text-xs italic text-black/50">
              TCS 0.5% / TDS 0.1% are withheld but reclaimable — not counted as cost.
            </p>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
