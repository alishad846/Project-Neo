import { Star, Zap, Send, Smile, MousePointer2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEyeTracking, PopButton, Sticker } from "@neo/ui";

export function Hero() {
  const { x, y } = useEyeTracking();
  const navigate = useNavigate();

  // The entrance fade/slide for ".pop-in" elements is pure CSS (see
  // styles.css) so it never depends on a JS animation library finishing
  // before paint — it also picks up prefers-reduced-motion for free via the
  // global override.
  return (
    <section
      className="relative w-full overflow-hidden py-24 text-black selection:bg-[#ff90e8] md:py-32"
      style={{ backgroundImage: "url(/images/LandingPageBG.jpg)", backgroundSize: "cover", backgroundPosition: "center" }}
    >
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
        <div className="relative flex w-full max-w-2xl flex-col items-center leading-none text-center">
          <h1
            className="pop-in relative z-10 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 font-display text-3xl leading-none text-black sm:gap-x-5 sm:text-7xl md:text-9xl"
            // Whoa Sauce is a heavy, connected display face — a little
            // letter-spacing stops the glyphs melting into each other so the
            // wordmark stays readable while keeping its cartoon character.
            style={{ animationDelay: "0s", letterSpacing: "0.04em" }}
          >
            <span className="display-outline-light">SELL</span>
            <span className="flex items-center display-outline-light">
              SM
              <span className="mx-1 flex gap-2">
                <span className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-white align-middle shadow-[3px_3px_0px_0px_#000] sm:h-12 sm:w-12 md:h-16 md:w-16">
                  <span
                    className="absolute h-3.5 w-3.5 rounded-full bg-black sm:h-5 sm:w-5 md:h-7 md:w-7"
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                  />
                </span>
                <span className="relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-white align-middle shadow-[3px_3px_0px_0px_#000] sm:h-12 sm:w-12 md:h-16 md:w-16">
                  <span
                    className="absolute h-3.5 w-3.5 rounded-full bg-black sm:h-5 sm:w-5 md:h-7 md:w-7"
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

          <div
            className="pop-in mt-8 flex w-full min-w-0 max-w-lg flex-col items-center gap-3 rounded-3xl border-2 border-black/70 bg-white/95 px-5 py-6 shadow-[6px_6px_0px_0px_rgba(26,22,15,0.9)] md:px-10 md:py-8"
            style={{ animationDelay: "0.3s" }}
          >
            <p className="max-w-full text-center font-accent text-lg text-black [text-wrap:balance] md:text-3xl">
              One catalog, every marketplace.
            </p>
            <p className="max-w-full font-body text-sm text-black/80 [text-wrap:pretty] md:text-lg">
              List once. Neo compiles your products for every store you sell on and fills the forms for you.
            </p>
          </div>
        </div>

        <div className="pop-in mt-10 flex flex-col gap-6 sm:flex-row" style={{ animationDelay: "0.5s" }}>
          <PopButton text="Get started free" color="#b2ff59" icon={Zap} onClick={() => navigate("/thank-you")} />
          <PopButton text="Free seller tools" color="#ffffff" icon={Send} onClick={() => navigate("/tools")} />
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
