import { Star, Zap, Send, Smile, MousePointer2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEyeTracking, PopButton, Sticker } from "@neo/ui";

export function Hero() {
  const { x, y } = useEyeTracking();
  const navigate = useNavigate();

  /*
   * Decorative particles only.
   * They don't affect any existing Hero functionality.
   */
  const particles = [
    { left: "8%", top: "18%", delay: "0s" },
    { left: "17%", top: "68%", delay: "1.2s" },
    { left: "28%", top: "28%", delay: "2.1s" },
    { left: "38%", top: "78%", delay: "0.7s" },
    { left: "52%", top: "15%", delay: "2.8s" },
    { left: "63%", top: "72%", delay: "1.7s" },
    { left: "74%", top: "25%", delay: "3.2s" },
    { left: "84%", top: "66%", delay: "0.9s" },
    { left: "92%", top: "38%", delay: "2.4s" },
    { left: "45%", top: "52%", delay: "3.8s" },
  ];

  return (
    <section className="relative w-full overflow-hidden py-24 text-black selection:bg-[#ff90e8] md:py-32">

      {/* ================================================================
          FADED FLOATING BACKGROUND PARTICLES
          Decorative only — existing functionality remains unchanged.
          ================================================================ */}
      <div
        className="hero-particles"
        aria-hidden="true"
      >
        {particles.map((particle, index) => (
          <span
            key={index}
            className="hero-particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: `${particle.delay}, ${particle.delay}`,
            }}
          />
        ))}
      </div>

      {/* Existing decorative stickers */}
      <Sticker className="left-10 top-16 hidden h-16 w-16 bg-[#00e5ff] rotate-12 md:flex">
        <Zap className="h-8 w-8 fill-yellow-300 stroke-black stroke-[3px]" />
      </Sticker>

      <Sticker className="right-16 top-12 hidden h-20 w-20 bg-[#ff90e8] -rotate-6 md:flex">
        <Star className="h-10 w-10 fill-white stroke-black stroke-[3px]" />
      </Sticker>

      <Sticker className="bottom-16 left-16 hidden h-14 w-14 bg-[#b2ff59] rotate-45 md:flex">
        <Smile className="h-8 w-8 text-black stroke-[3px]" />
      </Sticker>

      <div
        className="pop-in absolute bottom-10 right-10 hidden lg:block"
        style={{ animationDelay: "0.6s" }}
      >
        <div className="relative">
          <div className="absolute -top-12 -left-12 -rotate-12 bg-white border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_#000]">
            <span className="font-accent">Try me!</span>
          </div>

          <MousePointer2 className="w-12 h-12 stroke-[3px] fill-black rotate-[-15deg]" />
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center justify-center px-6">
        <div className="relative flex w-full max-w-2xl flex-col items-center leading-none text-center">

          {/* ================================================================
              EXISTING MAIN HEADING
              ================================================================ */}
          <h1
            className="pop-in heading-pop-pink relative z-10 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 font-display text-3xl leading-none text-black sm:gap-x-5 sm:text-7xl md:text-9xl"
            style={{
              animationDelay: "0s",
              letterSpacing: "0.04em",
            }}
          >
            <span>SELL</span>

            <span className="flex items-center">
              SM

              <span className="mx-1 flex gap-2">
                <span className="keep-round relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-white align-middle shadow-[3px_3px_0px_0px_#000] sm:h-12 sm:w-12 md:h-16 md:w-16">
                  <span
                    className="keep-round absolute h-3.5 w-3.5 rounded-full bg-black sm:h-5 sm:w-5 md:h-7 md:w-7"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  />
                </span>

                <span className="keep-round relative inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-black bg-white align-middle shadow-[3px_3px_0px_0px_#000] sm:h-12 sm:w-12 md:h-16 md:w-16">
                  <span
                    className="keep-round absolute h-3.5 w-3.5 rounded-full bg-black sm:h-5 sm:w-5 md:h-7 md:w-7"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                  />
                </span>
              </span>

              TH
            </span>
          </h1>

          {/* Existing sketchy underline */}
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

          {/* Existing description card */}
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

        {/* Existing buttons */}
        <div
          className="pop-in mt-10 flex flex-col gap-6 sm:flex-row"
          style={{ animationDelay: "0.5s" }}
        >
          <PopButton
            text="Get started"
            color="#b2ff59"
            icon={Zap}
            onClick={() => navigate("/signup")}
          />

          <PopButton
            text="Free seller tools"
            color="#ffffff"
            icon={Send}
            onClick={() => navigate("/tools")}
          />
        </div>
      </div>

      {/* ================================================================
          MARQUEE
          ================================================================ */}
      <div className="relative z-10 mt-16 w-full border-y-2 border-black/70 bg-[#ff90e8] py-3">

        <div className="neo-marquee flex animate-marquee whitespace-nowrap font-loud text-2xl tracking-wide">

          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className={`mx-8 ${
                i % 2 === 0
                  ? "text-black"
                  : "neo-marquee-accent"
              }`}
            >
              {i % 2 === 0
                ? "SNAP · EXTRACT · AUTOFILL"
                : "ONE CATALOG, EVERY MARKETPLACE"}
            </span>
          ))}

        </div>
      </div>
    </section>
  );
}