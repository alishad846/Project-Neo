import { useMemo, useState } from "react";
import { ToolPageLayout } from "../../components/tools/ToolPageLayout";

const GST_RATES = [0, 3, 5, 12, 18, 28];

// Typical rates only — always labelled as such. Sellers should confirm the
// exact HSN/rate with their CA; classifications and rates do change.
const HSN_HELPER: { hsn: string; description: string; typicalRate: number }[] = [
  { hsn: "6109", description: "T-shirts, singlets (knitted/crocheted)", typicalRate: 5 },
  { hsn: "6204", description: "Women's suits, dresses, skirts (not knitted)", typicalRate: 5 },
  { hsn: "6206", description: "Women's blouses, shirts", typicalRate: 5 },
  { hsn: "5407", description: "Woven fabrics of synthetic filament yarn", typicalRate: 5 },
  { hsn: "6117", description: "Made-up clothing accessories (knitted)", typicalRate: 12 },
  { hsn: "6302", description: "Bed linen, table linen, toilet/kitchen linen", typicalRate: 12 },
  { hsn: "4202", description: "Handbags, wallets, similar containers", typicalRate: 18 },
  { hsn: "7117", description: "Imitation jewellery", typicalRate: 3 },
];

const money = (n: number) => `₹${n.toFixed(2)}`;

const inputClass =
  "w-full rounded-lg border-2 border-black px-3 py-2 font-body text-sm outline-none focus:bg-[#fff8fb]";
const labelClass = "font-body text-xs font-semibold uppercase tracking-wide text-black/60";

export function GstCalculator() {
  const [amount, setAmount] = useState<number | "">("");
  const [rate, setRate] = useState(5);
  const [inclusive, setInclusive] = useState(false);
  const [interState, setInterState] = useState(false);

  const outcome = useMemo(() => {
    const amt = amount === "" ? NaN : Number(amount);
    if (!Number.isFinite(amt) || amt < 0) return null;

    const r = rate / 100;
    let base: number;
    let gstAmount: number;
    if (inclusive) {
      base = amt / (1 + r);
      gstAmount = amt - base;
    } else {
      base = amt;
      gstAmount = amt * r;
    }
    const total = base + gstAmount;
    if (!Number.isFinite(base) || !Number.isFinite(gstAmount) || !Number.isFinite(total)) return null;

    return {
      base,
      gstAmount,
      total,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: gstAmount,
    };
  }, [amount, rate, inclusive]);

  return (
    <ToolPageLayout
      title="GST Calculator"
      intro="Split an amount into base price and GST, either direction, plus a CGST/SGST vs IGST breakdown. Pure arithmetic — nothing leaves your browser."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Amount (₹)</span>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 1000"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>GST rate</span>
          <select className={inputClass} value={rate} onChange={(e) => setRate(Number(e.target.value))}>
            {GST_RATES.map((r) => (
              <option key={r} value={r}>
                {r}%
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="inclusive"
            type="checkbox"
            className="h-4 w-4 border-2 border-black"
            checked={inclusive}
            onChange={(e) => setInclusive(e.target.checked)}
          />
          <label htmlFor="inclusive" className="font-body text-sm">
            Amount entered above is GST-inclusive
          </label>
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="interstate"
            type="checkbox"
            className="h-4 w-4 border-2 border-black"
            checked={interState}
            onChange={(e) => setInterState(e.target.checked)}
          />
          <label htmlFor="interstate" className="font-body text-sm">
            Inter-state sale (show IGST instead of CGST/SGST split)
          </label>
        </div>
      </div>

      {!outcome ? (
        <p className="mt-6 font-body text-sm text-black/60">Enter an amount to see the GST breakdown.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border-2 border-black px-4 py-3">
            <div className="font-body text-xs uppercase tracking-wide text-black/60">Base amount</div>
            <div className="font-body text-xl font-bold">{money(outcome.base)}</div>
          </div>
          <div className="rounded-xl border-2 border-black px-4 py-3">
            <div className="font-body text-xs uppercase tracking-wide text-black/60">Total GST</div>
            <div className="font-body text-xl font-bold">{money(outcome.gstAmount)}</div>
          </div>

          {interState ? (
            <div className="col-span-2 rounded-xl border-2 border-black px-4 py-3">
              <div className="font-body text-xs uppercase tracking-wide text-black/60">IGST ({rate}%)</div>
              <div className="font-body text-xl font-bold">{money(outcome.igst)}</div>
            </div>
          ) : (
            <>
              <div className="rounded-xl border-2 border-black px-4 py-3">
                <div className="font-body text-xs uppercase tracking-wide text-black/60">CGST ({rate / 2}%)</div>
                <div className="font-body text-xl font-bold">{money(outcome.cgst)}</div>
              </div>
              <div className="rounded-xl border-2 border-black px-4 py-3">
                <div className="font-body text-xs uppercase tracking-wide text-black/60">SGST ({rate / 2}%)</div>
                <div className="font-body text-xl font-bold">{money(outcome.sgst)}</div>
              </div>
            </>
          )}

          <div className="col-span-2 rounded-xl border-2 border-black bg-[#b2ff59] px-4 py-3">
            <div className="font-body text-xs uppercase tracking-wide text-black/60">Total</div>
            <div className="font-body text-2xl font-bold">{money(outcome.total)}</div>
          </div>
        </div>
      )}

      <div className="mt-8 border-t-2 border-black/10 pt-6">
        <h2 className="font-accent text-lg text-black">HSN quick reference</h2>
        <p className="mt-1 font-body text-xs italic text-black/50">
          Typical rates for common apparel/textile HSN codes — always verify with your CA.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse font-body text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left text-xs uppercase tracking-wide text-black/60">
                <th className="py-1.5 pr-3">HSN</th>
                <th className="py-1.5 pr-3">Description</th>
                <th className="py-1.5">Typical rate</th>
              </tr>
            </thead>
            <tbody>
              {HSN_HELPER.map((row) => (
                <tr key={row.hsn} className="border-b border-black/10">
                  <td className="py-1.5 pr-3 font-semibold">{row.hsn}</td>
                  <td className="py-1.5 pr-3">{row.description}</td>
                  <td className="py-1.5 font-semibold">{row.typicalRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ToolPageLayout>
  );
}
