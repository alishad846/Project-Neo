import { Link } from "react-router-dom";
import { Calculator, Percent, Scissors, LayoutGrid, ArrowRight, type LucideIcon } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

interface ToolCard {
  to: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  color: string;
  rotate: string;
}

// Mirrors the tools on /tools — surfaced on the landing page as a free-tools
// grid so sellers can jump straight into a tool (the ecomdost hook: "try a
// free tool right now, no signup"). Keep in sync with pages/tools/ToolsIndex.
const TOOLS: ToolCard[] = [
  {
    to: "/tools/profit-calculator",
    title: "Profit Calculator",
    blurb: "Your real per-order margin after GST, packaging, shipping & returns.",
    icon: Calculator,
    color: "#b2ff59",
    rotate: "-rotate-1",
  },
  {
    to: "/tools/gst-calculator",
    title: "GST Calculator",
    blurb: "Split any amount into base + CGST/SGST or IGST, either way round.",
    icon: Percent,
    color: "#ffc93c",
    rotate: "rotate-1",
  },
  {
    to: "/tools/label-crop",
    title: "Label Crop",
    blurb: "Trim courier PDF labels to just the label. All in your browser.",
    icon: Scissors,
    color: "#ffffff",
    rotate: "-rotate-1",
  },
  {
    to: "/tools/label-merge",
    title: "Label Merge (A4)",
    blurb: "Pack 2–8 labels per A4 sheet for cheaper, faster printing.",
    icon: LayoutGrid,
    color: "#8ecdff",
    rotate: "rotate-1",
  },
];

const TRUST = ["100% free", "No signup", "Runs in your browser"];

export function ToolsShowcase() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <SectionBg
      id="tools"
      tone="light"
      className="comic-panel comic-pink section-fade-top mt-12 rounded-t-[2.5rem] md:mt-20"
      contentClassName="relative z-10"
    >
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-4 text-center font-loud text-4xl text-black heading-pop sm:text-6xl md:text-8xl">
          FREE SELLER TOOLS.
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-center font-cartoon text-xl text-black/80">
          Handy calculators and label tools every Meesho seller needs — open one and use it right now.
        </p>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {TRUST.map((t) => (
            <span
              key={t}
              className="rounded-full border-2 border-black/70 bg-white px-4 py-1.5 font-loud text-base text-black shadow-[2px_2px_0px_0px_rgba(26,22,15,0.85)]"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((tool) => (
            <Link
              key={tool.to}
              to={tool.to}
              className={`${tool.rotate} group flex flex-col rounded-2xl border-2 border-black/70 bg-white p-6 shadow-[7px_7px_0px_0px_rgba(26,22,15,0.9)] transition-all hover:-translate-y-1 hover:rotate-0 hover:shadow-[10px_10px_0px_0px_rgba(26,22,15,0.9)]`}
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-black/70 shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)]"
                style={{ backgroundColor: tool.color }}
              >
                <tool.icon className="h-7 w-7 stroke-[3px] text-black" />
              </div>
              <h3 className="font-loud text-2xl text-black">{tool.title}</h3>
              <p className="mt-2 flex-1 font-cartoon text-sm text-black/70">{tool.blurb}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-body text-sm font-bold text-black group-hover:text-[#ff2fb0]">
                Try it free
                <ArrowRight className="h-4 w-4 stroke-[3px] transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 rounded-md border border-black/40 bg-[#ffc93c] px-7 py-4 font-body text-lg font-bold text-black shadow-[6px_6px_0px_0px_rgba(26,22,15,0.9)] transition-transform hover:-translate-y-1"
          >
            See all free tools
            <ArrowRight className="h-5 w-5 stroke-[3px]" />
          </Link>
        </div>
      </div>
    </SectionBg>
  );
}
