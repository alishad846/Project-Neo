import { Check, Undo2 } from "lucide-react";
import { PopButton } from "@neo/ui";
import { PRICE_RULES, PRICE_ROWS } from "../data";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

export function PriceShowcase() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <SectionBg tone="light" className="comic-cream" contentClassName="relative z-10">
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-4 text-center font-loud text-3xl text-black heading-pop sm:text-5xl md:text-7xl">
          CHANGE 500 PRICES. UNDO IN ONE CLICK.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center font-cartoon text-lg text-black/80">
          Dry-run every change before it touches your live catalogue. Don't like it? Hit Previous.
        </p>

        <div className="mb-10 flex flex-wrap justify-center gap-4">
          {PRICE_RULES.map((rule, i) => (
            <span
              key={rule}
              className={`rounded-md border border-black/40 px-5 py-2 font-body text-sm font-bold shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)] ${
                i === 0 ? "-rotate-1 bg-[#b2ff59]" : "rotate-1 bg-white"
              }`}
            >
              {rule}
            </span>
          ))}
        </div>

        <div className="rounded-2xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000] md:p-8">
          <p className="mb-4 font-loud text-2xl text-black">Dry-run preview</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse font-cartoon text-sm">
              <thead>
                <tr className="border-b-4 border-black text-left">
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Old → New</th>
                  <th className="px-3 py-2">Margin</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {PRICE_ROWS.map((row) => (
                  <tr key={row.sku} className="border-b-2 border-black/20">
                    <td className="px-3 py-3 font-bold">{row.sku}</td>
                    <td className="px-3 py-3">{row.name}</td>
                    <td className="px-3 py-3">
                      <span className="text-black/40 line-through">₹{row.oldPrice}</span>{" "}
                      <span className="text-black">→</span>{" "}
                      <span className="font-bold">₹{row.newPrice}</span>
                    </td>
                    <td className="px-3 py-3">{row.margin}%</td>
                    <td className="px-3 py-3">
                      {row.breakeven ? (
                        <span className="rounded-full border-2 border-black bg-[#b2ff59] px-3 py-1 text-xs font-bold uppercase">
                          safe
                        </span>
                      ) : (
                        <span className="rounded-full border-2 border-black bg-red-400 px-3 py-1 text-xs font-bold uppercase">
                          below break-even ⚠
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="font-cartoon text-sm italic text-black/60">
              Every change is reversible — apply now, undo any time before it's final.
            </p>
            <div className="flex gap-4">
              <PopButton text="Previous" color="#ffffff" icon={Undo2} />
              <PopButton text="Apply" color="#b2ff59" icon={Check} />
            </div>
          </div>
        </div>
      </div>
    </SectionBg>
  );
}
