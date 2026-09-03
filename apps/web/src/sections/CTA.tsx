import { Zap } from "lucide-react";
import { PopButton } from "@neo/ui";

export function CTA() {
  return (
    <section className="bg-[#fff0f5] pt-24 md:pt-32">
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 text-center md:pb-32">
        <h2 className="mb-10 font-loud text-6xl text-black md:text-8xl [-webkit-text-stroke:3px_black]">
          STOP TYPING. START LISTING.
        </h2>
        <PopButton text="Get Early Access" color="#b2ff59" icon={Zap} />
      </div>
      <div className="overflow-hidden border-t-4 border-black bg-[#ff90e8] py-3">
        <div className="flex animate-marquee whitespace-nowrap font-loud text-2xl tracking-widest text-black">
          <span className="mx-8">💥 ONE GENOME · EVERY MARKETPLACE</span>
          <span className="mx-8">★ FREE · LOCAL-FIRST · REVERSIBLE</span>
          <span className="mx-8">💥 ONE GENOME · EVERY MARKETPLACE</span>
          <span className="mx-8">★ FREE · LOCAL-FIRST · REVERSIBLE</span>
          <span className="mx-8">💥 ONE GENOME · EVERY MARKETPLACE</span>
          <span className="mx-8">★ FREE · LOCAL-FIRST · REVERSIBLE</span>
          <span className="mx-8">💥 ONE GENOME · EVERY MARKETPLACE</span>
          <span className="mx-8">★ FREE · LOCAL-FIRST · REVERSIBLE</span>
        </div>
      </div>
    </section>
  );
}
