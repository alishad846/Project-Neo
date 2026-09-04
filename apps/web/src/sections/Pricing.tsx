import { Check, Zap, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PopButton } from "@neo/ui";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

// One simple paid plan. Launch pricing anchors against the "real" ₹3999 so the
// ₹999 reads as a steep, time-limited discount — that contrast is what builds
// urgency. The free browser tools stay free regardless; this is for Neo Pro
// (AI compose + autofill + bulk price manager).
const FEATURES = [
  "AI compose + one-click autofill",
  "One catalog, every marketplace",
  "Bulk price manager with dry-run + undo",
  "Profit & breakeven calculators",
  "GST calculator + label PDF tools",
  "Priority support",
];

export function Pricing() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const navigate = useNavigate();
  return (
    <SectionBg id="pricing" tone="light" className="comic-cream" contentClassName="relative z-10">
      <div ref={ref} className={`mx-auto max-w-3xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <span className="mx-auto mb-5 flex w-fit items-center gap-2 border border-black/40 bg-[#ff90e8] px-4 py-1.5 font-loud text-lg text-black shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)]">
          <Clock className="h-4 w-4 stroke-[3px]" />
          Launch offer — save 75%
        </span>
        <h2 className="mb-4 text-center font-display text-5xl text-black heading-pop-pink sm:text-6xl md:text-8xl" style={{ letterSpacing: "0.02em" }}>
          GET FULL ACCESS.
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center font-body text-xl text-black/75">
          Everything Neo does, one simple plan. Lock in the launch price before it goes back up — the
          free browser tools stay free either way.
        </p>

        <div className="relative border border-black/40 bg-white p-8 shadow-[10px_10px_0px_0px_rgba(26,22,15,0.9)] md:p-10">
          <span className="absolute -top-4 right-8 border border-black/40 bg-[#ffc93c] px-3 py-1 font-loud text-sm text-black shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)]">
            75% OFF
          </span>

          <p className="font-loud text-3xl text-black">NEO PRO</p>
          <p className="mb-6 font-body text-base text-black/60">Everything below, for one seller account.</p>

          <div className="mb-8 flex items-end gap-3">
            <span className="font-body text-3xl text-black/40 line-through">₹3999</span>
            <span className="font-loud text-6xl text-[#ff2fb0] md:text-7xl">₹999</span>
            <span className="mb-1.5 font-body text-lg text-black/60">/ year</span>
          </div>

          <ul className="mb-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-3 font-body text-base text-black">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-black/40 bg-[#b2ff59]">
                  <Check className="h-3.5 w-3.5 stroke-[4px] text-black" />
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mb-6 flex items-center gap-2 border border-black/20 bg-[#fff0f5] px-4 py-2 font-body text-sm text-black/70">
            <Clock className="h-4 w-4 shrink-0 stroke-[3px] text-[#ff2fb0]" />
            Launch price is limited — it returns to ₹3999 after the launch window.
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <PopButton text="Get started" color="#b2ff59" icon={Zap} onClick={() => navigate("/signup")} />
            <PopButton text="Open free tools" color="#ff90e8" icon={Sparkles} onClick={() => navigate("/tools")} />
          </div>
        </div>
      </div>
    </SectionBg>
  );
}
