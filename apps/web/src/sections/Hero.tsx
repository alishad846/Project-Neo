import { Star, Zap, Send, Smile, MousePointer2 } from "lucide-react";
import { useEyeTracking, PopButton, Sticker } from "@neo/ui";
import gsap from "gsap";
import { useEffect } from "react";

export function Hero() {
  const { x, y } = useEyeTracking();

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline();
    tl.from(".pop-in", reduceMotion
      ? { opacity: 0, duration: 0.3 }
      : { scale: 0, opacity: 0, duration: 0.8, stagger: 0.1, ease: "elastic.out(1, 0.5)" });
    const gridAnimation = reduceMotion
      ? null
      : gsap.to(".bg-grid", { backgroundPosition: "100px 100px", duration: 20, repeat: -1, ease: "none" });
    return () => {
      tl.kill();
      gridAnimation?.kill();
    };
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#fff0f5] text-black selection:bg-[#ff90e8] scroll-smooth">
      <div
        className="bg-grid absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, #000 2px, transparent 2.5px)", backgroundSize: "30px 30px" }}
      />
      <Sticker className="left-20 top-32 h-16 w-16 bg-[#00e5ff] rotate-12" delay={0}>
        <Zap className="h-8 w-8 fill-yellow-300 stroke-black stroke-[3px]" />
      </Sticker>
      <Sticker className="right-32 top-24 h-20 w-20 bg-[#ff90e8] -rotate-6" delay={0.5}>
        <Star className="h-10 w-10 fill-white stroke-black stroke-[3px]" />
      </Sticker>
      <Sticker className="bottom-32 left-32 h-14 w-14 bg-[#b2ff59] rotate-45" delay={1}>
        <Smile className="h-8 w-8 text-black stroke-[3px]" />
      </Sticker>
      <div className="pop-in absolute bottom-20 right-20 hidden md:block">
        <div className="relative">
          <div className="absolute -top-12 -left-12 -rotate-12 bg-white border-4 border-black px-4 py-2 rounded-xl shadow-[4px_4px_0px_0px_#000]">
            <span className="font-cartoon font-bold">Try me!</span>
          </div>
          <MousePointer2 className="w-12 h-12 stroke-[3px] fill-black rotate-[-15deg] animate-bounce" />
        </div>
      </div>
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center">
        <div className="relative flex flex-col items-center leading-none">
          <h1 className="pop-in relative z-10 -rotate-3 font-loud text-8xl md:text-[10rem] text-[#ff90e8] drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] [-webkit-text-stroke:4px_black]">
            MAKE MEESHO
          </h1>
          <div className="pop-in relative z-20 flex items-center gap-4">
            <h1 className="rotate-2 font-loud text-8xl md:text-[10rem] text-[#00e5ff] drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] [-webkit-text-stroke:4px_black]">
              L
            </h1>
            <div className="flex gap-4">
              <div className="relative h-16 w-16 md:h-24 md:w-24 overflow-hidden rounded-full border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000]">
                <div
                  className="absolute h-8 w-8 md:h-12 md:w-12 rounded-full bg-black"
                  style={{ left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                />
              </div>
              <div className="relative h-16 w-16 md:h-24 md:w-24 overflow-hidden rounded-full border-4 border-black bg-white shadow-[6px_6px_0px_0px_#000]">
                <div
                  className="absolute h-8 w-8 md:h-12 md:w-12 rounded-full bg-black"
                  style={{ left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                />
              </div>
            </div>
            <h1 className="rotate-2 font-loud text-8xl md:text-[10rem] text-[#00e5ff] drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] [-webkit-text-stroke:4px_black]">
              K
            </h1>
          </div>
          <h1 className="pop-in relative z-10 -rotate-1 font-loud text-8xl md:text-[10rem] text-[#ffeb3b] drop-shadow-[6px_6px_0px_rgba(0,0,0,1)] [-webkit-text-stroke:4px_black]">
            EASY.
          </h1>
        </div>
        <div className="pop-in mt-12 flex flex-col gap-6 sm:flex-row">
          <PopButton text="Start Listing" color="#b2ff59" icon={Zap} />
          <PopButton text="See It Compile" color="#ffffff" icon={Send} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full border-t-4 border-black bg-[#ff90e8] py-3">
        <div className="flex animate-marquee whitespace-nowrap font-loud text-2xl tracking-widest text-black">
          <span className="mx-8">💥 NO MORE COPY-PASTE LISTINGS</span>
          <span className="mx-8">★ SNAP · EXTRACT · AUTOFILL</span>
          <span className="mx-8">💥 NO MORE COPY-PASTE LISTINGS</span>
          <span className="mx-8">★ SNAP · EXTRACT · AUTOFILL</span>
          <span className="mx-8">💥 NO MORE COPY-PASTE LISTINGS</span>
          <span className="mx-8">★ SNAP · EXTRACT · AUTOFILL</span>
          <span className="mx-8">💥 NO MORE COPY-PASTE LISTINGS</span>
          <span className="mx-8">★ SNAP · EXTRACT · AUTOFILL</span>
        </div>
      </div>
    </section>
  );
}
