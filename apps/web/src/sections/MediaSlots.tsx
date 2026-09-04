import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

export function MediaSlots() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <SectionBg id="demo" tone="light" className="comic-cream" contentClassName="relative z-10">
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-4 text-center font-loud text-4xl text-black heading-pop sm:text-5xl md:text-7xl">
          SEE IT IN ACTION.
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center font-cartoon text-lg text-black/70">
          Watch Neo read a product and fill a whole Meesho listing — hands off the keyboard.
        </p>

        <div className="mx-auto max-w-4xl">
          {/* Real product demo. Muted + playsInline so it can autoplay on mobile;
              loop keeps the loop tidy; controls let the seller scrub. */}
          <div className="-rotate-1 rounded-2xl border-2 border-black/70 bg-white p-3 shadow-[10px_10px_0px_0px_rgba(26,22,15,0.9)]">
            <video
              className="aspect-video w-full rounded-xl border border-black/40 bg-black"
              src="/media/neo-demo.mp4"
              controls
              playsInline
              muted
              loop
              preload="metadata"
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/tools"
            className="group inline-flex items-center gap-2 rounded-xl border border-black/70 bg-[#ff90e8] px-7 py-4 font-loud text-xl text-black shadow-[6px_6px_0px_0px_rgba(26,22,15,0.9)] transition-transform hover:-translate-y-1"
          >
            Try our free tools
            <ArrowRight className="h-5 w-5 stroke-[3px] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </SectionBg>
  );
}
