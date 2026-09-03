import { Zap } from "lucide-react";
import { PopButton } from "@neo/ui";
import { useReveal } from "../hooks/useReveal";

export function CTA() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="bg-[#fff0f5] pt-24 md:pt-32">
      <div
        ref={ref}
        className={`mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 text-center md:pb-32 reveal ${visible ? "reveal-visible" : ""}`}
      >
        <h2 className="mb-4 font-loud text-5xl text-black md:text-7xl [-webkit-text-stroke:3px_black]">
          STOP TYPING. START LISTING.
        </h2>
        <p className="mb-10 max-w-xl font-body text-lg text-black/80">
          One catalog, every marketplace you sell on. Start your 7-day trial today.
        </p>
        <PopButton text="Start 7-day trial" color="#b2ff59" icon={Zap} />
      </div>
      <div className="overflow-hidden border-t-4 border-black bg-[#ff90e8] py-3">
        <div className="flex animate-marquee whitespace-nowrap font-accent text-xl tracking-wide text-black">
          <span className="mx-8">ONE CATALOG · EVERY MARKETPLACE</span>
          <span className="mx-8">DRY-RUN · REVERSIBLE · YOURS</span>
          <span className="mx-8">ONE CATALOG · EVERY MARKETPLACE</span>
          <span className="mx-8">DRY-RUN · REVERSIBLE · YOURS</span>
          <span className="mx-8">ONE CATALOG · EVERY MARKETPLACE</span>
          <span className="mx-8">DRY-RUN · REVERSIBLE · YOURS</span>
          <span className="mx-8">ONE CATALOG · EVERY MARKETPLACE</span>
          <span className="mx-8">DRY-RUN · REVERSIBLE · YOURS</span>
        </div>
      </div>
    </section>
  );
}
