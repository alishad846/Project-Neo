import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Undo2, RotateCcw } from "lucide-react";
import { PopButton } from "@neo/ui";
import { computeCost, type RuleSet } from "@neo/rules-engine";
import { ProductPicker } from "./ProductPicker";
import { dryRunPricing, applyPricing, undoPricing, resetPrices, getProducts, type DryRunResult } from "../api";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

const GST_RATES = [0, 5, 12, 18] as const;

// Mirrors the website's PriceShowcase.tsx SELLER_COST_RULES: a bare-bones
// rule set (no fees, no marketplace commission) used purely to compute the
// GST-to-remit info figure from each product's own cost/price — never sent
// to the backend, never affects the actual proposed price.
const SELLER_COST_RULES: RuleSet = {
  effectiveFrom: "2024-01-01",
  margin: { packagingFee: 0, returnShippingCost: 0, defectRate: 0, shippingGstRate: 0, feeGstRate: 0 },
  categories: [{ category: "*", gstRate: 0, defaultReturnRate: 0, commissionRate: 0 }],
  shipping: [{ maxWeightKg: Infinity, charge: 0 }],
};

interface Settings {
  discount: number;
  gst: number;
  roundCharm: boolean;
  floorBE: boolean;
}

const INITIAL_SETTINGS: Settings = { discount: 0, gst: 0, roundCharm: false, floorBE: true };

export function AddDiscount() {
  const [selected, setSelected] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [preview, setPreview] = useState<DryRunResult | null>(null);
  const [txnId, setTxnId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // ProductPicker fetches its own list; mirror it here so this component
  // can read costPrice for the table without widening ProductPicker's
  // props contract to expose its internal fetch result.
  const captureProducts = useCallback((list: Product[]) => {
    setProducts(list);
  }, []);

  // Changing the selection after Preview must not let Apply act on SKUs
  // whose margin/breakeven were never shown — clear the stale preview
  // (and any pending undo target) the same way the rule controls do.
  function updateSelected(skus: string[]) {
    setSelected(skus);
    setPreview(null);
  }

  // Average GST embedded in the previewed prices — an info-only figure
  // (what you'd remit / claim as ITC per order), computed client-side from
  // each SKU's proposed price and its own cost, exactly like the website's
  // PriceShowcase.tsx. Never sent to the backend as part of the rule.
  const avgGstToRemit = useMemo(() => {
    if (!preview || preview.diffs.length === 0) return 0;
    const total = preview.diffs.reduce((sum, d) => {
      const product = products.find((p) => p.sku === d.sku);
      const costPrice = product?.costPrice != null ? Number(product.costPrice) : 0;
      const { gstComponent } = computeCost(
        { sellingPrice: d.proposedPrice, manufacturingCost: costPrice, gstRate: settings.gst / 100 },
        SELLER_COST_RULES,
      );
      return sum + gstComponent;
    }, 0);
    return Math.round(total / preview.diffs.length);
  }, [preview, products, settings.gst]);

  async function runPreview() {
    if (selected.length === 0) return;
    setBusy(true);
    setError("");
    try {
      const result = await dryRunPricing(
        {
          actionType: "PERCENTAGE_DISCOUNT",
          actionValue: settings.discount,
          roundToCharm: settings.roundCharm,
          floorBreakeven: settings.floorBE,
        },
        selected,
      );
      setPreview(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    setBusy(true);
    setError("");
    try {
      const result = await applyPricing(
        {
          actionType: "PERCENTAGE_DISCOUNT",
          actionValue: settings.discount,
          roundToCharm: settings.roundCharm,
          floorBreakeven: settings.floorBE,
        },
        selected,
      );
      setTxnId(result.txnId);
      setSettings((s) => ({ ...s, discount: 0 }));
      setPreview(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (txnId == null) return;
    setBusy(true);
    setError("");
    try {
      await undoPricing(txnId);
      setTxnId(null);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resetSelected() {
    if (selected.length === 0) return;
    setBusy(true);
    setError("");
    try {
      await resetPrices(selected);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="font-accent text-xl tracking-wide text-black">Add Discount</h2>
      <p className="mt-1 mb-3 font-body text-xs text-black/60">
        Select products, set a rule, apply it — the new price is saved and shows up in Bulk Catalogue automatically.
        Discounted products carry a badge below; select them and hit Reset to go back to base price.
      </p>

      <ProductPicker key={refreshKey} selected={selected} onSelectedChange={updateSelected} />
      {/* ProductPicker doesn't expose the product list it fetches internally,
          so this loader makes its own identical GET /products call to give
          this component costPrice for the table. */}
      <ProductListLoader onLoaded={captureProducts} refreshKey={refreshKey} />

      {selected.length > 0 && (
        <div className="mt-3 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
          <label className="mb-2 flex items-center justify-between font-cartoon text-xs font-semibold">
            <span>Discount</span>
            <span className="text-base text-[#ff2fb0]">{settings.discount}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.discount}
            onChange={(e) => {
              setSettings((s) => ({ ...s, discount: Number(e.target.value) }));
              setPreview(null);
            }}
            className="w-full"
          />

          <div className="mt-2 flex gap-2">
            {GST_RATES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSettings((s) => ({ ...s, gst: g }))}
                className={`flex-1 rounded-md border-2 border-black px-2 py-1 font-cartoon text-xs font-bold ${
                  settings.gst === g ? "bg-[#00e5ff]" : "bg-white"
                }`}
              >
                {g}%
              </button>
            ))}
          </div>
          {preview && (
            <p className="mt-1 font-cartoon text-[10px] text-black/60">
              GST doesn't change the buyer's price — it's baked in either way. ≈ ₹{avgGstToRemit} per order to
              collect / claim as ITC.
            </p>
          )}

          <label className="mt-2 flex items-center gap-2 font-cartoon text-xs font-semibold">
            <input
              type="checkbox"
              checked={settings.roundCharm}
              onChange={(e) => {
                setSettings((s) => ({ ...s, roundCharm: e.target.checked }));
                setPreview(null);
              }}
            />
            Round Off Charm
          </label>
          <label className="mt-1 flex items-center gap-2 font-cartoon text-xs font-semibold">
            <input
              type="checkbox"
              checked={settings.floorBE}
              onChange={(e) => {
                setSettings((s) => ({ ...s, floorBE: e.target.checked }));
                setPreview(null);
              }}
            />
            Floor at break-even
          </label>

          <button
            type="button"
            disabled={busy}
            onClick={runPreview}
            className="mt-2 w-full rounded-lg border-2 border-black bg-[#ffeb3b] px-3 py-2 font-cartoon text-xs font-semibold disabled:opacity-50"
          >
            Preview
          </button>

          {preview && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse font-cartoon text-[11px]">
                <thead>
                  <tr className="border-b-2 border-black text-left">
                    <th>SKU</th>
                    <th>Cost</th>
                    <th>New Price</th>
                    <th>Margin</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.diffs.map((d) => {
                    const product = products.find((p) => p.sku === d.sku);
                    const cost = product?.costPrice != null ? Number(product.costPrice) : 0;
                    const marginPct = d.proposedPrice > 0 ? (d.proposedMargin / d.proposedPrice) * 100 : 0;
                    return (
                      <tr key={d.sku} className="border-t border-black/10">
                        <td>{d.sku}</td>
                        <td>₹{cost}</td>
                        <td className={d.belowBreakeven ? "text-red-600" : ""}>₹{Math.round(d.proposedPrice)}</td>
                        <td>{Math.round(marginPct)}%</td>
                        <td className={d.proposedMargin >= 0 ? "text-green-600" : "text-red-600"}>
                          {d.proposedMargin >= 0 ? "+" : "−"}₹{Math.round(Math.abs(d.proposedMargin))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="mt-2 font-cartoon text-xs text-red-600">{error}</p>}

          <div className="mt-3 flex flex-col gap-2">
            <PopButton text="Apply" color="#b2ff59" icon={Check} onClick={apply} disabled={busy || !preview} />
            <PopButton text="Previous (undo)" color="#ffffff" icon={Undo2} onClick={undo} disabled={busy || txnId == null} />
            <PopButton
              text="Reset selected to base price"
              color="#ffe680"
              icon={RotateCcw}
              onClick={resetSelected}
              disabled={busy || selected.length === 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Thin helper: ProductPicker already fetches the product list internally,
// but doesn't expose it upward (its contract is selection-only). Rather
// than widen ProductPicker's props for this one caller, this loader makes
// its own identical GET /products call so AddDiscount can read costPrice
// per selected SKU for the table.
function ProductListLoader({ onLoaded, refreshKey }: { onLoaded: (p: Product[]) => void; refreshKey: number }) {
  useEffect(() => {
    getProducts().then(onLoaded).catch(() => undefined);
  }, [refreshKey, onLoaded]);
  return null;
}
