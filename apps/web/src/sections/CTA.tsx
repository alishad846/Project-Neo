import { Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PopButton } from "@neo/ui";
import { useReveal } from "../hooks/useReveal";

export function CTA() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const navigate = useNavigate();
  return (
    <section className="comic-panel comic-yellow section-fade-top relative mt-12 w-full overflow-hidden rounded-t-[2.5rem] pt-24 text-black md:mt-20 md:pt-32">
      <div
        ref={ref}
        className={`relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-24 text-center md:pb-32 reveal ${visible ? "reveal-visible" : ""}`}
      >
        <h2 className="mb-4 font-display text-4xl text-black heading-pop-pink sm:text-5xl md:text-7xl" style={{ letterSpacing: "0.03em" }}>
          STOP TYPING. START LISTING.
        </h2>
        <p className="mb-10 max-w-xl font-cartoon text-xl text-black/80">
          One catalog, every marketplace you sell on. Grab Neo Pro at the launch price — ₹999, down from ₹3999.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <PopButton text="Get started" color="#ff90e8" icon={Zap} onClick={() => navigate("/signup")} />
          <PopButton text="Browse free tools" color="#ffffff" icon={ArrowRight} onClick={() => navigate("/tools")} />
        </div>
      </div>
      <div className="overflow-hidden border-t-2 border-black/70 bg-[#ff90e8] py-3">
        <div className="flex animate-marquee whitespace-nowrap font-loud text-2xl tracking-wide">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`mx-8 ${
                i % 2 === 0
                  ? "text-black"
                  : "text-[#ffdc00] [text-shadow:_1.5px_1.5px_0_rgba(26,22,15,0.75)]"
              }`}
            >
              {i % 2 === 0 ? "ONE CATALOG · EVERY MARKETPLACE" : "DRY-RUN · REVERSIBLE · YOURS"}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
