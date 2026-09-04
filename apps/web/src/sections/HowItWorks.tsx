import { Camera, Sparkles, Send, type LucideIcon } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { SectionBg } from "../components/SectionBg";

interface Step {
  icon: LucideIcon;
  color: string;
  title: string;
  body: string;
  rotate: string;
}

const STEPS: Step[] = [
  {
    icon: Camera,
    color: "#00e5ff",
    title: "Snap a photo",
    body: "Point at any product. Neo's on-device AI reads the whole product — fabric, colour, neck, HSN — no typing.",
    rotate: "-rotate-2",
  },
  {
    icon: Sparkles,
    color: "#ff90e8",
    title: "Neo builds the genome",
    body: "One canonical record. Edit once, it stays the source of truth for every marketplace.",
    rotate: "rotate-1",
  },
  {
    icon: Send,
    color: "#b2ff59",
    title: "Autofill your listing",
    body: "Neo fills the marketplace's form for you and stops at Submit so you stay in control.",
    rotate: "-rotate-1",
  },
];

export function HowItWorks() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <SectionBg
      id="how"
      tone="light"
      className="comic-panel comic-yellow section-fade-top mt-12 rounded-t-[2.5rem] md:mt-20"
      contentClassName="relative z-10"
    >
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-16 text-center font-loud text-4xl text-black heading-pop sm:text-6xl md:text-8xl">
          SNAP. COMPILE. DONE.
        </h2>
        <div className="grid gap-10 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.title}
              className={`${step.rotate} flex flex-col items-center rounded-2xl border-4 border-black bg-white p-8 text-center shadow-[6px_6px_0px_0px_#000] transition-transform hover:-translate-y-1 hover:rotate-0`}
            >
              <div
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-black shadow-[4px_4px_0px_0px_#000]"
                style={{ backgroundColor: step.color }}
              >
                <step.icon className="h-10 w-10 stroke-[3px] text-black" />
              </div>
              <h3 className="mb-3 font-loud text-3xl text-black">{step.title}</h3>
              <p className="font-cartoon text-base text-black/80">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionBg>
  );
}
