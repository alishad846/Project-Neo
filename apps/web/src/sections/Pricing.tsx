import { Check, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PopButton } from "@neo/ui";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

// Everything Neo does is free — no tiers, no premium, no card. This section
// replaces the old Pro/Business pricing table with one loud "always free"
// statement plus the full feature list, so sellers see there's no paywall.
const FEATURES = [
  "AI compose + one-click autofill",
  "One catalog, every marketplace",
  "Bulk price manager with dry-run + undo",
  "Profit & breakeven calculators",
  "GST calculator + label PDF tools",
  "Runs in your browser — nothing to install to try",
];

export function Pricing() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const navigate = useNavigate();
  return (
    <SectionBg id="pricing" tone="light" className="comic-cream" contentClassName="relative z-10">
      <div ref={ref} className={`mx-auto max-w-4xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <span className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border-2 border-black/70 bg-[#b2ff59] px-4 py-1.5 font-loud text-lg text-black shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)]">
          <Sparkles className="h-4 w-4 stroke-[3px]" />
          No premium. No catch.
        </span>
        <h2 className="mb-4 text-center font-display text-5xl text-black heading-pop-pink sm:text-6xl md:text-8xl" style={{ letterSpacing: "0.02em" }}>
          ALWAYS FREE.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center font-cartoon text-xl text-black/75">
          Every tool, every marketplace, every feature — free forever. We don't hide the good stuff behind a
          paywall. Sign up and use the lot.
        </p>

        <div className="relative rounded-2xl border-2 border-black/70 bg-white p-8 shadow-[10px_10px_0px_0px_rgba(26,22,15,0.9)] md:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            {/* Magic Cookie (font-cartoon), NOT font-display: the Whoa Sauce
                display face has no digit glyphs (renders a watermark for "0"). */}
            <p className="font-cartoon text-7xl font-bold text-[#ff2fb0] drop-shadow-[3px_3px_0px_rgba(26,22,15,0.25)] md:text-8xl">
              ₹0
            </p>
            <p className="mt-1 font-cartoon text-lg text-black/60">forever — for every seller</p>
          </div>

          <ul className="mx-auto mb-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 font-cartoon text-base text-black">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black/70 bg-[#ffc93c]">
                  <Check className="h-3.5 w-3.5 stroke-[4px] text-black" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PopButton text="Get started free" color="#b2ff59" icon={Zap} onClick={() => navigate("/thank-you")} />
            <PopButton text="Open free tools" color="#ff90e8" icon={Sparkles} onClick={() => navigate("/tools")} />
          </div>
        </div>
      </div>
    </SectionBg>
  );
}
