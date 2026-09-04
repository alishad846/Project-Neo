import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { PRODUCTS } from "../data";
import type { AdapterOutput } from "../data";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

const MARKETPLACES: AdapterOutput["marketplace"][] = ["Meesho", "Amazon India", "Flipkart"];

const SHORT_NAMES: Record<string, string> = {
  kurti: "Kurti",
  saree: "Saree",
};

export function CompileDemo() {
  const [productIndex, setProductIndex] = useState(0);
  const [marketplace, setMarketplace] = useState<AdapterOutput["marketplace"]>("Meesho");

  const product = PRODUCTS[productIndex];
  const output = product.outputs.find((o) => o.marketplace === marketplace) ?? product.outputs[0];
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <SectionBg tone="light" className="comic-cream" contentClassName="relative z-10">
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-4 text-center font-loud text-3xl text-black heading-pop sm:text-5xl md:text-7xl">
          ONE PRODUCT. EVERY MARKETPLACE.
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center font-cartoon text-lg text-black/80">
          Meesho, Amazon and Flipkart each want it in a different shape. Neo compiles the translation — you don't.
        </p>

        <div className="mb-8 flex justify-center gap-3">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.genome.id}
              onClick={() => setProductIndex(i)}
              className={`rounded-md border border-black/40 px-5 py-2 font-body text-sm font-bold shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)] transition-transform hover:-translate-y-0.5 ${
                i === productIndex ? "bg-[#ffc93c]" : "bg-white"
              }`}
            >
              {SHORT_NAMES[p.genome.id] ?? p.genome.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center">
          <div className="flex-1 -rotate-1 rounded-2xl border-4 border-black bg-[#ff90e8] p-6 shadow-[6px_6px_0px_0px_#000]">
            <p className="mb-1 font-loud text-2xl text-black">Product Genome</p>
            <p className="mb-4 font-cartoon text-sm text-black/70">
              {product.genome.sku} · {product.genome.hero}
            </p>
            <h3 className="mb-4 font-loud text-3xl text-black">{product.genome.name}</h3>
            <div className="space-y-2">
              {product.genome.fields.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between rounded-lg border-2 border-black bg-white/80 px-3 py-2 font-cartoon text-sm"
                >
                  <span className="font-bold uppercase tracking-wide text-black/60">{f.label}</span>
                  <span className="text-black">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-center py-2 md:py-0">
            <ArrowRight className="h-10 w-10 rotate-90 stroke-[3px] text-black md:h-14 md:w-14 md:rotate-0" />
          </div>

          <div className="flex-1 rotate-1 rounded-2xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-4 flex flex-wrap gap-2">
              {MARKETPLACES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMarketplace(m)}
                  className={`rounded-md border border-black/40 px-4 py-2 font-body text-sm font-bold shadow-[2px_2px_0px_0px_rgba(26,22,15,0.85)] transition-transform hover:-translate-y-0.5 ${
                    m === marketplace ? "bg-[#00e5ff]" : "bg-[#fff7fb]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <span className="mb-4 inline-block rounded-full border-2 border-black bg-[#ffeb3b] px-3 py-1 font-cartoon text-xs font-bold uppercase tracking-wide">
              {output.transport}
            </span>
            <div className="mt-4 space-y-2">
              {output.fields.map((f) => (
                <div key={f.key} className="rounded-lg border-2 border-black bg-[#fff0f5] px-3 py-2 font-cartoon text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wide text-black/60">{f.key}</span>
                    <span className="text-right text-black">{f.value}</span>
                  </div>
                  {f.note && <p className="mt-1 text-right text-xs italic text-black/50">{f.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionBg>
  );
}
