import { Star, Zap, Send, Smile, MousePointer2 } from "lucide-react";
import { useEyeTracking, PopButton, Sticker } from "@neo/ui";
import gsap from "gsap";
import { useEffect } from "react";

export function Hero() {
  const { x, y } = useEyeTracking();

  // The entrance fade/slide for ".pop-in" elements is pure CSS (see
  // styles.css) so it never depends on a JS animation library finishing
  // before paint — it also picks up prefers-reduced-motion for free via the
  // global override. GSAP is reserved here for the decorative, purely
  // cosmetic background drift, which is safe to skip entirely.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // The polka-dot backdrop drifts, very slowly, instead of racing.
    const gridAnimation = gsap.to(".bg-grid", {
      backgroundPosition: "40px 40px",
      duration: 60,
      repeat: -1,
      ease: "none",
    });

    return () => {
      gridAnimation.kill();
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-[#fff0f5] py-24 text-black selection:bg-[#ff90e8] md:py-32">
      <div
        className="bg-grid absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, #000 2px, transparent 2.5px)", backgroundSize: "30px 30px" }}
      />
      <Sticker className="left-10 top-16 hidden h-16 w-16 bg-[#00e5ff] rotate-12 md:flex">
        <Zap className="h-8 w-8 fill-yellow-300 stroke-black stroke-[3px]" />
      </Sticker>
      <Sticker className="right-16 top-12 hidden h-20 w-20 bg-[#ff90e8] -rotate-6 md:flex">
        <Star className="h-10 w-10 fill-white stroke-black stroke-[3px]" />
      </Sticker>
      <Sticker className="bottom-16 left-16 hidden h-14 w-14 bg-[#b2ff59] rotate-45 md:flex">
        <Smile className="h-8 w-8 text-black stroke-[3px]" />
      </Sticker>
      <div className="pop-in absolute bottom-10 right-10 hidden lg:block" style={{ animationDelay: "0.6s" }}>
        <div className="relative">
          <div className="absolute -top-12 -left-12 -rotate-12 bg-white border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_#000]">
            <span className="font-accent">Try me!</span>
          </div>
          <MousePointer2 className="w-12 h-12 stroke-[3px] fill-black rotate-[-15deg]" />
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center justify-center px-6">
        <div className="relative flex flex-col items-center leading-none text-center">
          <h1
            className="pop-in relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-display text-7xl leading-none text-black md:text-9xl"
            style={{ animationDelay: "0s" }}
          >
            <span className="text-[#ff90e8] drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] md:drop-shadow-[5px_5px_0px_rgba(0,0,0,1)]">SELL</span>
            <span className="flex items-center text-[#00e5ff] drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] md:drop-shadow-[5px_5px_0px_rgba(0,0,0,1)]">
              SM
              <span className="mx-1 flex gap-2">
                <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-4 border-black bg-white align-middle shadow-[4px_4px_0px_0px_#000] md:h-16 md:w-16">
                  <span
                    className="absolute h-5 w-5 rounded-full bg-black md:h-7 md:w-7"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  />
                </span>
                <span className="relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-4 border-black bg-white align-middle shadow-[4px_4px_0px_0px_#000] md:h-16 md:w-16">
                  <span
                    className="absolute h-5 w-5 rounded-full bg-black md:h-7 md:w-7"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  />
                </span>
              </span>
              TH
            </span>
          </h1>

          {/* Sketchy accent — a hand-drawn underline beneath the headline. */}
          <svg
            className="pop-in scribble-underline mt-1 max-w-xs text-black md:max-w-md"
            style={{ animationDelay: "0.15s" }}
            viewBox="0 0 300 20"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M2 12 C 40 4, 80 18, 120 10 C 160 3, 200 16, 240 9 C 265 5, 285 12, 298 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>

          <p className="pop-in mt-8 font-accent text-2xl text-black md:text-3xl" style={{ animationDelay: "0.3s" }}>
            One catalog, every marketplace.
          </p>
          <p
            className="pop-in mx-auto mt-4 max-w-xl font-body text-base text-black/80 md:text-lg"
            style={{ animationDelay: "0.4s" }}
          >
            List once. Neo compiles your products for every store you sell on and fills the forms for you.
          </p>
        </div>

        <div className="pop-in mt-10 flex flex-col gap-6 sm:flex-row" style={{ animationDelay: "0.5s" }}>
          <PopButton text="Start 7-day trial" color="#b2ff59" icon={Zap} />
          <PopButton text="See how it works" color="#ffffff" icon={Send} />
        </div>
      </div>

      <div className="relative mt-16 w-full border-y-4 border-black bg-[#ff90e8] py-3">
        <div className="flex animate-marquee whitespace-nowrap font-accent text-xl tracking-wide text-black">
          <span className="mx-8">SNAP · EXTRACT · AUTOFILL</span>
          <span className="mx-8">ONE CATALOG, EVERY MARKETPLACE</span>
          <span className="mx-8">SNAP · EXTRACT · AUTOFILL</span>
          <span className="mx-8">ONE CATALOG, EVERY MARKETPLACE</span>
          <span className="mx-8">SNAP · EXTRACT · AUTOFILL</span>
          <span className="mx-8">ONE CATALOG, EVERY MARKETPLACE</span>
          <span className="mx-8">SNAP · EXTRACT · AUTOFILL</span>
          <span className="mx-8">ONE CATALOG, EVERY MARKETPLACE</span>
        </div>
      </div>
    </section>
  );
}
