import { useMemo, useState } from "react";

const GST_RATES = [0, 3, 5, 12, 18, 28];

const money = (n: number) => `₹${n.toFixed(2)}`;

const inputClass = "rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

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
    <div className="p-4">
      <h2 className="font-accent text-xl tracking-wide text-black">GST Calculator</h2>

      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <input
          className={`${inputClass} col-span-2`}
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Amount (₹)"
        />
        <select
          className={`${inputClass} col-span-2`}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        >
          {GST_RATES.map((r) => (
            <option key={r} value={r}>
              {r}% GST
            </option>
          ))}
        </select>

        <label className="col-span-2 flex items-center gap-2 font-cartoon text-xs">
          <input
            type="checkbox"
            className="h-4 w-4 border-2 border-black"
            checked={inclusive}
            onChange={(e) => setInclusive(e.target.checked)}
          />
          Amount is GST-inclusive
        </label>

        <label className="col-span-2 flex items-center gap-2 font-cartoon text-xs">
          <input
            type="checkbox"
            className="h-4 w-4 border-2 border-black"
            checked={interState}
            onChange={(e) => setInterState(e.target.checked)}
          />
          Inter-state (IGST)
        </label>
      </div>

      {!outcome ? (
        <p className="mt-3 font-cartoon text-xs text-black/60">
          Enter an amount to see the GST breakdown.
        </p>
      ) : (
        <div className="mt-3 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
          <div className="grid grid-cols-2 gap-2 font-cartoon text-xs">
            <div className="rounded-lg border-2 border-black px-2 py-1.5">
              Base amount<div className="font-semibold">{money(outcome.base)}</div>
            </div>
            <div className="rounded-lg border-2 border-black px-2 py-1.5">
              Total GST<div className="font-semibold">{money(outcome.gstAmount)}</div>
            </div>

            {interState ? (
              <div className="col-span-2 rounded-lg border-2 border-black px-2 py-1.5">
                IGST ({rate}%)<div className="font-semibold">{money(outcome.igst)}</div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border-2 border-black px-2 py-1.5">
                  CGST ({rate / 2}%)<div className="font-semibold">{money(outcome.cgst)}</div>
                </div>
                <div className="rounded-lg border-2 border-black px-2 py-1.5">
                  SGST ({rate / 2}%)<div className="font-semibold">{money(outcome.sgst)}</div>
                </div>
              </>
            )}
          </div>

          <div className="mt-2 rounded-lg border-2 border-black bg-[#b2ff59] px-2 py-1.5 font-cartoon text-xs font-semibold">
            Total: {money(outcome.total)}
          </div>
        </div>
      )}

      <p className="mt-3 font-cartoon text-[10px] italic text-black/50">
        See the full HSN reference on the website.
      </p>
    </div>
  );
}
