import { useMemo, useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { PopButton } from "@neo/ui";
import { PRICE_ROWS } from "../data";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

// Marketing count used in the copy to signal "bulk" — the table below shows a
// live sample of 10 real SKUs; the rule conceptually hits all 500.
const TOTAL_SKUS = 500;
const GST_RATES = [0, 5, 12, 18] as const;

interface Settings {
  discount: number; // % off list price
  gst: number; // GST % added on top of the net price
  round99: boolean; // round each net price to ₹__99
  floorBE: boolean; // never let the net price fall below break-even (cost)
}

const BASELINE: Settings = { discount: 0, gst: 0, round99: false, floorBE: true };

function costOf(row: (typeof PRICE_ROWS)[number]) {
  return Math.round(row.newPrice * (1 - row.margin / 100));
}
function roundTo99(p: number) {
  return Math.max(99, Math.round((p - 99) / 100) * 100 + 99);
}

// Net (ex-GST) and listed (incl-GST) price for a row under a set of knobs.
function priceUnder(row: (typeof PRICE_ROWS)[number], s: Settings) {
  let net = row.oldPrice * (1 - s.discount / 100);
  if (s.round99) net = roundTo99(net);
  const cost = costOf(row);
  if (s.floorBE && net < cost) net = cost;
  net = Math.round(net);
  const listed = Math.round(net * (1 + s.gst / 100));
  return { net, listed, cost };
}
function marginOf(net: number, cost: number) {
  return net <= 0 ? 0 : Math.round(((net - cost) / net) * 100);
}
function settingsEqual(a: Settings, b: Settings) {
  return a.discount === b.discount && a.gst === b.gst && a.round99 === b.round99 && a.floorBE === b.floorBE;
}

export function PriceShowcase() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  const [settings, setSettings] = useState<Settings>({ discount: 10, gst: 0, round99: false, floorBE: true });
  const [applied, setApplied] = useState<Settings>(BASELINE);
  const [prev, setPrev] = useState<Settings | null>(null);
  const [justApplied, setJustApplied] = useState(false);

  const rows = useMemo(
    () =>
      PRICE_ROWS.map((row) => {
        const now = priceUnder(row, applied);
        const next = priceUnder(row, settings);
        return {
          sku: row.sku,
          name: row.name,
          oldListed: now.listed,
          newListed: next.listed,
          margin: marginOf(next.net, next.cost),
          breakeven: next.net >= next.cost,
          changed: next.listed !== now.listed,
        };
      }),
    [settings, applied],
  );

  const pendingChange = !settingsEqual(settings, applied);
  const belowCount = rows.filter((r) => !r.breakeven).length;

  function apply() {
    setPrev(applied);
    setApplied(settings);
    setJustApplied(true);
  }
  function undo() {
    if (!prev) return;
    setApplied(prev);
    setSettings(prev);
    setPrev(null);
    setJustApplied(false);
  }
  function update(patch: Partial<Settings>) {
    setSettings((s) => ({ ...s, ...patch }));
    setJustApplied(false);
  }

  return (
    <SectionBg tone="light" className="comic-cream" contentClassName="relative z-10">
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-4 text-center font-loud text-3xl text-black heading-pop sm:text-5xl md:text-7xl">
          CHANGE {TOTAL_SKUS} PRICES. UNDO IN ONE CLICK.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center font-body text-lg text-black/75">
          Set a rule, watch every price update live, then apply it to all {TOTAL_SKUS} SKUs at once. Don&rsquo;t
          like it? Hit Previous.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* LEFT — live dry-run table (sample of the 500) */}
          <div className="border border-black/40 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)] md:p-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="font-loud text-2xl text-black">Dry-run preview</p>
              <span className="border border-black/30 bg-[#ffe680] px-3 py-1 font-body text-xs font-bold uppercase tracking-wide text-black">
                {TOTAL_SKUS} SKUs · live sample
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse font-body text-sm">
                <thead>
                  <tr className="border-b-2 border-black text-left">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Old → New</th>
                    <th className="px-3 py-2">Margin</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.sku} className="border-b border-black/15">
                      <td className="px-3 py-2.5 font-bold">{row.sku}</td>
                      <td className="px-3 py-2.5">{row.name}</td>
                      <td className="px-3 py-2.5 tabular-nums">
                        <span className="text-black/40 line-through">₹{row.oldListed}</span>{" "}
                        <span className="text-black">→</span>{" "}
                        <span className={`font-bold ${row.changed ? "text-[#ff2fb0]" : "text-black"}`}>
                          ₹{row.newListed}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{row.margin}%</td>
                      <td className="px-3 py-2.5">
                        {row.breakeven ? (
                          <span className="border border-black/40 bg-[#b2ff59] px-2.5 py-1 text-xs font-bold uppercase">
                            safe
                          </span>
                        ) : (
                          <span className="border border-black/40 bg-red-400 px-2.5 py-1 text-xs font-bold uppercase">
                            below
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — rule controls, then immersive Apply / Undo */}
          <div className="flex flex-col gap-5">
            <div className="border border-black/40 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)]">
              <p className="mb-5 font-loud text-2xl text-black">Your rule</p>

              <label className="mb-5 block">
                <span className="mb-2 flex items-center justify-between font-body text-sm font-bold uppercase tracking-wide text-black/70">
                  <span>Discount</span>
                  <span className="font-loud text-2xl text-[#ff2fb0]">{settings.discount}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={settings.discount}
                  onChange={(e) => update({ discount: Number(e.target.value) })}
                  aria-label="Discount percentage"
                  className="h-3 w-full cursor-pointer appearance-none border border-black/40 bg-[#ffe680] accent-[#ff2fb0]"
                />
              </label>

              <div className="mb-5">
                <span className="mb-2 block font-body text-sm font-bold uppercase tracking-wide text-black/70">
                  GST / tax
                </span>
                <div className="flex gap-2">
                  {GST_RATES.map((g) => (
                    <button
                      key={g}
                      onClick={() => update({ gst: g })}
                      className={`flex-1 border border-black/40 px-2 py-2 font-body text-sm font-bold shadow-[2px_2px_0px_0px_rgba(26,22,15,0.85)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none ${
                        settings.gst === g ? "bg-[#00e5ff]" : "bg-white"
                      }`}
                    >
                      {g}%
                    </button>
                  ))}
                </div>
              </div>

              <label className="mb-3 flex cursor-pointer items-center gap-2 border border-black/40 bg-[#fff0f5] px-4 py-2.5 font-body text-sm font-bold text-black">
                <input
                  type="checkbox"
                  checked={settings.round99}
                  onChange={(e) => update({ round99: e.target.checked })}
                  className="h-4 w-4 accent-[#ff2fb0]"
                />
                Round to ₹__99
              </label>
              <label className="flex cursor-pointer items-center gap-2 border border-black/40 bg-[#fff0f5] px-4 py-2.5 font-body text-sm font-bold text-black">
                <input
                  type="checkbox"
                  checked={settings.floorBE}
                  onChange={(e) => update({ floorBE: e.target.checked })}
                  className="h-4 w-4 accent-[#ff2fb0]"
                />
                Floor at break-even
              </label>
            </div>

            {/* Status + immersive Apply / Undo */}
            <div className="border border-black/40 bg-white p-5 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)]">
              <p className="mb-4 font-body text-sm text-black/70">
                {justApplied ? (
                  <span className="font-bold text-black">✓ Applied to all {TOTAL_SKUS} SKUs — reversible.</span>
                ) : pendingChange ? (
                  <>
                    Pending: <span className="font-bold text-[#ff2fb0]">{settings.discount}% off</span> on{" "}
                    {TOTAL_SKUS} SKUs
                    {belowCount > 0 && <span className="font-bold text-red-500"> · {belowCount} below</span>}
                  </>
                ) : (
                  <span>Live prices are up to date.</span>
                )}
              </p>
              <div className="flex flex-col gap-3">
                <PopButton text="Apply to 500" color="#b2ff59" icon={Check} onClick={apply} disabled={!pendingChange} />
                <PopButton text="Previous (undo)" color="#ffffff" icon={Undo2} onClick={undo} disabled={!prev} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionBg>
  );
}
