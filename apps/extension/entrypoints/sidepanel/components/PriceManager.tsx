import React, { useState } from "react";
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
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Price Manager</h1>

      <div style={{ display: "grid", gap: 8, margin: "12px 0" }}>
        <select value={actionType} onChange={(e) => { setActionType(e.target.value as PricingRule["actionType"]); invalidatePreview(); }}>
          <option value="PERCENTAGE_DISCOUNT">Percentage discount (%)</option>
          <option value="FLAT_DISCOUNT">Flat discount (₹)</option>
          <option value="SET_FIXED">Set fixed price (₹)</option>
          <option value="TARGET_MARGIN">Target margin (₹)</option>
        </select>
        <input type="number" value={actionValue} onChange={(e) => { setActionValue(Number(e.target.value)); invalidatePreview(); }} placeholder="Value" />
        <input type="number" value={floorPrice} onChange={(e) => { setFloorPrice(e.target.value === "" ? "" : Number(e.target.value)); invalidatePreview(); }} placeholder="Floor price (optional)" />
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={roundTo99} onChange={(e) => { setRoundTo99(e.target.checked); invalidatePreview(); }} /> Round to .99
        </label>
      </div>

      <button disabled={busy} onClick={() => { const r = rule(); run(() => dryRunPricing(r), (res) => { setPreview(res); setPreviewedRule(r); setTxnId(null); }); }}>
        Preview (dry-run)
      </button>

      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      {preview && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 13 }}>
            {preview.totalSkus} SKUs · total margin change{" "}
            <strong style={{ color: preview.totalMarginDelta < 0 ? "crimson" : "green" }}>{money(preview.totalMarginDelta)}</strong>
          </p>
          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
            <thead>
              <tr><th align="left">SKU</th><th align="right">Old</th><th align="right">New</th><th align="right">Δ margin</th></tr>
            </thead>
            <tbody>
              {preview.diffs.map((d) => (
                <tr key={d.sku} style={{ borderTop: "1px solid #eee", color: d.belowBreakeven ? "crimson" : undefined }}>
                  <td>{d.sku}</td>
                  <td align="right">{money(d.currentPrice)}</td>
                  <td align="right">{money(d.proposedPrice)}</td>
                  <td align="right">{money(d.proposedMargin - d.currentMargin)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {txnId == null ? (
            <button disabled={busy || !previewedRule} style={{ marginTop: 12 }}
              onClick={() => run(() => applyPricing(previewedRule!), (r) => setTxnId(r.txnId))}>
              Confirm &amp; apply
            </button>
          ) : (
            <div style={{ marginTop: 12 }}>
              <p style={{ color: "green", fontSize: 13 }}>Applied as transaction #{txnId}.</p>
              <button disabled={busy}
                onClick={() => run(() => undoPricing(txnId), () => invalidatePreview())}>
                Undo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
