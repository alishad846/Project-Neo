import { Layers, ScanLine, Undo2, Calculator, ShieldCheck, Store, type LucideIcon } from "lucide-react";

interface Row {
  feature: string;
  ecomdost: string;
  neo: string;
}

const ROWS: Row[] = [
  { feature: "Marketplaces", ecomdost: "❌ Meesho only", neo: "✅ Meesho + Amazon + Flipkart" },
  { feature: "Reads product from a photo (AI)", ecomdost: "❌ manual entry", neo: "✅ free on-device AI" },
  { feature: "One canonical product genome", ecomdost: "❌", neo: "✅ edit once, compile anywhere" },
  { feature: "Bulk price manager", ecomdost: "❌ paid credits", neo: "✅ included, with breakeven math" },
  { feature: "Dry-run + one-click undo", ecomdost: "❌", neo: "✅ every change is reversible" },
  { feature: "Profit / breakeven calculator", ecomdost: "⚠️ free (separate tool)", neo: "✅ built in" },
  { feature: "Autofill listings", ecomdost: "✅ (₹1,499)", neo: "✅ free" },
  { feature: "Price", ecomdost: "₹1,499+ lifetime", neo: "Free / local-first" },
];

interface SuperpowerCard {
  icon: LucideIcon;
  title: string;
  body: string;
}

const SUPERPOWERS: SuperpowerCard[] = [
  { icon: Layers, title: "Multi-marketplace compile", body: "One genome compiles into Meesho, Amazon and Flipkart listings." },
  { icon: ScanLine, title: "On-device AI extraction", body: "Photos become structured product data, free and local." },
  { icon: Undo2, title: "Reversible transactions", body: "Every bulk change ships with a one-click undo." },
  { icon: Calculator, title: "Breakeven-aware pricing", body: "Price changes are checked against margin before they apply." },
  { icon: ShieldCheck, title: "Your data stays on device", body: "No catalogue uploads to a third-party server to get started." },
  { icon: Store, title: "Built for Meesho/Amazon/Flipkart", body: "Native adapters for the marketplaces sellers actually use." },
];

export function Comparison() {
  return (
    <section className="bg-[#fff0f5] py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="mb-4 text-center font-loud text-5xl text-black md:text-7xl [-webkit-text-stroke:2px_black]">
          NEO vs THE REST.
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center font-cartoon text-lg text-black/80">
          Other tools stop at Meesho. Neo compiles your whole catalogue — and reads it from a photo.
        </p>

        <div className="mb-16 overflow-x-auto rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_#000]">
          <table className="w-full min-w-[640px] border-collapse bg-white font-cartoon text-sm">
            <thead>
              <tr>
                <th className="border-b-4 border-black px-4 py-3 text-left">Feature</th>
                <th className="border-b-4 border-l-4 border-black px-4 py-3 text-left">Ecomdost</th>
                <th className="border-b-4 border-l-4 border-black bg-[#00e5ff] px-4 py-3 text-left font-loud text-lg">
                  Neo
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b-2 border-black/20">
                  <td className="px-4 py-3 font-bold">{row.feature}</td>
                  <td className="border-l-4 border-black/20 px-4 py-3 text-black/70">{row.ecomdost}</td>
                  <td className="border-l-4 border-black/20 bg-[#00e5ff]/10 px-4 py-3 font-bold">{row.neo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {SUPERPOWERS.map((card, i) => (
            <div
              key={card.title}
              className={`${i % 2 === 0 ? "-rotate-1" : "rotate-1"} rounded-2xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#000] transition-transform hover:-translate-y-1 hover:rotate-0`}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-black bg-[#ffeb3b] shadow-[3px_3px_0px_0px_#000]">
                <card.icon className="h-7 w-7 stroke-[3px] text-black" />
              </div>
              <h3 className="mb-2 font-loud text-xl text-black">{card.title}</h3>
              <p className="font-cartoon text-sm text-black/70">{card.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
