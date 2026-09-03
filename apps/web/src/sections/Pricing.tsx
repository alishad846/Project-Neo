import { Check, Zap } from "lucide-react";
import { PopButton } from "@neo/ui";
import { useReveal } from "../hooks/useReveal";

interface Tier {
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "PRO",
    price: "₹499",
    cadence: "/mo",
    tagline: "For a single store, done right.",
    features: [
      "One connected store",
      "AI compose + autofill",
      "Bulk price manager",
      "Breakeven calculators",
    ],
  },
  {
    name: "BUSINESS",
    price: "₹999",
    cadence: "/mo",
    tagline: "For sellers running more than one storefront.",
    features: [
      "Everything in Pro",
      "Multi-store, one catalog",
      "Priority support",
      "Bulk operations at scale",
    ],
    highlight: true,
  },
];

export function Pricing() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section id="pricing" className="bg-[#fff0f5] py-24 md:py-32">
      <div ref={ref} className={`mx-auto max-w-5xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-4 text-center font-loud text-5xl text-black md:text-7xl [-webkit-text-stroke:2px_black]">
          PICK YOUR PLAN.
        </h2>
        <p className="mx-auto mb-3 max-w-2xl text-center font-body text-lg text-black/80">
          7 days free to try. Then keep going for a plan that fits.
        </p>
        <p className="mx-auto mb-14 max-w-md text-center font-body text-xs italic text-black/50">
          Launch pricing — final numbers TBD.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] ${
                tier.highlight ? "bg-[#ffeb3b]" : "bg-white"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-4 left-8 rounded-full border-2 border-black bg-[#ff90e8] px-3 py-1 font-accent text-sm">
                  Most popular
                </span>
              )}
              <h3 className="mb-1 font-display text-4xl text-black drop-shadow-[2px_2px_0px_rgba(255,144,232,1)]">
                {tier.name}
              </h3>
              <p className="mb-4 font-body text-sm text-black/70">{tier.tagline}</p>
              <p className="mb-6 font-body text-4xl font-bold text-black">
                {/* TODO: replace with real price */}
                {tier.price}
                <span className="font-body text-base font-normal text-black/60">{tier.cadence}</span>
              </p>
              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 font-body text-sm text-black">
                    <Check className="h-4 w-4 shrink-0 stroke-[3px]" />
                    {feature}
                  </li>
                ))}
              </ul>
              <PopButton text="Start 7-day trial" color={tier.highlight ? "#ffffff" : "#b2ff59"} icon={Zap} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
