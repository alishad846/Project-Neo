import { Link } from "react-router-dom";
import { Calculator, Percent, Scissors, LayoutGrid, type LucideIcon } from "lucide-react";

interface ToolCard {
  to: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  color: string;
}

const TOOLS: ToolCard[] = [
  {
    to: "/tools/profit-calculator",
    title: "Profit & Breakeven Calculator",
    blurb: "See your real per-order margin after GST, packaging, shipping, and returns.",
    icon: Calculator,
    color: "#b2ff59",
  },
  {
    to: "/tools/gst-calculator",
    title: "GST Calculator",
    blurb: "Split any amount into base + CGST/SGST or IGST, either way round.",
    icon: Percent,
    color: "#ffe680",
  },
  {
    to: "/tools/label-crop",
    title: "Shipping Label Crop",
    blurb: "Trim courier PDF labels to just the label — no upload, all in your browser.",
    icon: Scissors,
    color: "#ff90e8",
  },
  {
    to: "/tools/label-merge",
    title: "Label Merge (A4)",
    blurb: "Combine 2 to 8 shipping labels per A4 sheet for cheaper, faster printing.",
    icon: LayoutGrid,
    color: "#8ecdff",
  },
];

export function ToolsIndex() {
  return (
    <main className="grain-yellow min-h-screen px-4 py-10 md:px-6 md:py-16">
      <div className="relative z-10 mx-auto max-w-5xl">
        <h1 className="font-display text-5xl text-black drop-shadow-[3px_3px_0px_rgba(255,144,232,1)] md:text-6xl">
          Free Tools
        </h1>
        <p className="mt-3 max-w-xl font-body text-lg text-black/80">
          No signup, no upload, no catch. Calculators run instantly and the PDF tools process
          everything right in your browser.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className="group flex flex-col rounded-2xl border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000] transition-all hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_#000]"
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black"
                style={{ backgroundColor: tool.color }}
              >
                <tool.icon className="h-6 w-6 stroke-[3px] text-black" />
              </div>
              <h2 className="font-accent text-xl text-black">{tool.title}</h2>
              <p className="mt-2 font-body text-sm text-black/70">{tool.blurb}</p>
              <span className="mt-4 font-body text-sm font-semibold text-black underline decoration-2 underline-offset-2 group-hover:text-[#ff90e8]">
                Open tool →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
