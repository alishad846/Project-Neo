import React, { useState } from "react";
import { Check, Undo2, Eye } from "lucide-react";
import { PopButton } from "@neo/ui";
import { dryRunPricing, applyPricing, undoPricing, type PricingRule, type DryRunResult } from "../api";

const money = (n: number) => `₹${n.toFixed(2)}`;

export function PriceManager() {
  const [actionType, setActionType] = useState<PricingRule["actionType"]>("PERCENTAGE_DISCOUNT");
  const [actionValue, setActionValue] = useState(10);
  const [floorPrice, setFloorPrice] = useState<number | "">("");
  const [roundTo99, setRoundTo99] = useState(false);
  const [preview, setPreview] = useState<DryRunResult | null>(null);
  const [previewedRule, setPreviewedRule] = useState<PricingRule | null>(null);
  const [txnId, setTxnId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rule = (): PricingRule => ({
    actionType,
    actionValue: Number(actionValue),
    floorPrice: floorPrice === "" ? undefined : Number(floorPrice),
    roundTo99,
  });

  // Editing the rule invalidates any shown preview, so the diff on screen always
  // reflects the rule that would be applied. Apply binds to the previewed rule,
  // never a re-read of live form state.
  function invalidatePreview() {
    setPreview(null);
    setPreviewedRule(null);
    setTxnId(null);
  }

  async function run<T>(fn: () => Promise<T>, after: (r: T) => void) {
    setBusy(true); setError(null);
    try { after(await fn()); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="p-4">
      <h2 className="font-accent text-xl tracking-wide text-black">Price Manager</h2>

      <div className="mt-3 grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <select
          className="rounded-lg border-2 border-black bg-white px-2 py-1.5 font-cartoon text-xs"
          value={actionType}
          onChange={(e) => { setActionType(e.target.value as PricingRule["actionType"]); invalidatePreview(); }}
        >
          <option value="PERCENTAGE_DISCOUNT">Percentage discount (%)</option>
          <option value="FLAT_DISCOUNT">Flat discount (₹)</option>
          <option value="SET_FIXED">Set fixed price (₹)</option>
          <option value="TARGET_MARGIN">Target margin (₹)</option>
        </select>
        <input
          className="rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs"
          type="number"
          value={actionValue}
          onChange={(e) => { setActionValue(Number(e.target.value)); invalidatePreview(); }}
          placeholder="Value"
        />
        <input
          className="rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs"
          type="number"
          value={floorPrice}
          onChange={(e) => { setFloorPrice(e.target.value === "" ? "" : Number(e.target.value)); invalidatePreview(); }}
          placeholder="Floor price (optional)"
        />
        <label className="flex items-center gap-2 font-cartoon text-xs">
          <input
            type="checkbox"
            checked={roundTo99}
            onChange={(e) => { setRoundTo99(e.target.checked); invalidatePreview(); }}
          />
          Round to .99
        </label>
      </div>

      <button
        disabled={busy}
        className="mt-3 flex items-center gap-2 rounded-lg border-2 border-black bg-[#ffeb3b] px-3 py-2 font-cartoon text-xs font-semibold shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50"
        onClick={() => { const r = rule(); run(() => dryRunPricing(r), (res) => { setPreview(res); setPreviewedRule(r); setTxnId(null); }); }}
      >
        <Eye className="h-3.5 w-3.5 stroke-[3px]" />
        Preview (dry-run)
      </button>

      {error && <p className="mt-2 font-cartoon text-xs text-red-600">{error}</p>}

      {preview && (
        <div className="mt-3 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
          <p className="font-cartoon text-xs">
            {preview.totalSkus} SKUs · total margin change{" "}
            <strong className={preview.totalMarginDelta < 0 ? "text-red-600" : "text-green-700"}>
              {money(preview.totalMarginDelta)}
            </strong>
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[280px] border-collapse font-cartoon text-[11px]">
              <thead>
                <tr className="border-b-2 border-black">
                  <th align="left">SKU</th><th align="right">Old</th><th align="right">New</th><th align="right">Δ margin</th>
                </tr>
              </thead>
              <tbody>
                {preview.diffs.map((d) => (
                  <tr key={d.sku} className={`border-t border-black/10 ${d.belowBreakeven ? "text-red-600" : ""}`}>
                    <td>{d.sku}</td>
                    <td align="right">{money(d.currentPrice)}</td>
                    <td align="right">{money(d.proposedPrice)}</td>
                    <td align="right">{money(d.proposedMargin - d.currentMargin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {txnId == null ? (
            <div className="mt-3">
              <PopButton
                text="Apply"
                color="#b2ff59"
                icon={Check}
                variant="panel"
                disabled={busy || !previewedRule}
                onClick={() => { if (busy || !previewedRule) return; run(() => applyPricing(previewedRule), (r) => setTxnId(r.txnId)); }}
              />
            </div>
          ) : (
            <div className="mt-3">
              <p className="font-cartoon text-xs font-semibold text-green-700">Applied as transaction #{txnId}.</p>
              <div className="mt-2">
                <PopButton
                  text="Previous"
                  color="#00e5ff"
                  icon={Undo2}
                  variant="panel"
                  disabled={busy}
                  onClick={() => { if (busy) return; run(() => undoPricing(txnId), () => invalidatePreview()); }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
