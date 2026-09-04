import { Link } from "react-router-dom";
import { Camera, Sparkles, Send, ArrowRight, type LucideIcon } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

interface Beat {
  icon: LucideIcon;
  text: string;
}

// Left-column narration for what the demo video is showing, step by step.
const BEATS: Beat[] = [
  { icon: Camera, text: "Snap the product photo — Neo reads fabric, colour, neck, HSN on-device." },
  { icon: Sparkles, text: "It compiles one clean genome and drafts the title, description & attributes." },
  { icon: Send, text: "Neo fills the whole Meesho form for you and stops at Submit — you stay in control." },
];

export function MediaSlots() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <SectionBg id="demo" tone="light" className="comic-cream" contentClassName="relative z-10">
      <div
        ref={ref}
        className={`mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-[320px_1fr] md:gap-12 reveal ${
          visible ? "reveal-visible" : ""
        }`}
      >
        {/* LEFT — heading + what's happening */}
        <div>
          <h2 className="mb-4 font-loud text-4xl text-black heading-pop sm:text-5xl md:text-6xl">
            SEE IT IN ACTION.
          </h2>
          <p className="mb-8 max-w-md font-body text-lg text-black/70">
            One product photo becomes a finished marketplace listing — hands off the keyboard. Here&rsquo;s
            exactly what Neo does in the clip:
          </p>

          <ul className="mb-8 flex flex-col gap-4">
            {BEATS.map((beat) => (
              <li key={beat.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-black/40 bg-[#ffc93c] shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)]">
                  <beat.icon className="h-4 w-4 stroke-[3px] text-black" />
                </span>
                <span className="font-body text-base text-black/80">{beat.text}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/tools"
            className="group inline-flex items-center gap-2 rounded-md border border-black/40 bg-[#ff90e8] px-6 py-3 font-body text-base font-bold text-black shadow-[5px_5px_0px_0px_rgba(26,22,15,0.9)] transition-transform hover:-translate-y-1"
          >
            Try our free tools
            <ArrowRight className="h-5 w-5 stroke-[3px] transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* RIGHT — large autoplaying, looping demo (no manual controls) */}
        <div className="border border-black/40 bg-white p-2 shadow-[12px_12px_0px_0px_rgba(26,22,15,0.9)] md:p-3">
          <video
            className="aspect-video w-full border border-black/30 bg-black"
            src="/media/neo-demo.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>
      </div>
    </SectionBg>
  );
}
