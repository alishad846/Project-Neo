import { useReveal } from "../hooks/useReveal";

export function MediaSlots() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section className="bg-[#fff0f5] py-24 md:py-32">
      <div ref={ref} className={`mx-auto max-w-6xl px-6 reveal ${visible ? "reveal-visible" : ""}`}>
        <h2 className="mb-14 text-center font-loud text-5xl text-black md:text-7xl [-webkit-text-stroke:2px_black]">
          SEE IT IN ACTION.
        </h2>
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-start md:justify-center">
          {/* TODO: replace with real demo video */}
          <div
            data-media-slot="hero-video"
            className="-rotate-1 flex aspect-video w-full max-w-xl items-center justify-center rounded-2xl border-4 border-black bg-white p-3 shadow-[8px_8px_0px_0px_#000] md:w-2/3"
          >
            <div className="flex h-full w-full items-center justify-center rounded-xl border-4 border-dashed border-black/40 bg-[#fff0f5]">
              <span className="font-loud text-2xl text-black/50">▶ your demo video here</span>
            </div>
          </div>

          {/* TODO: replace with real product/extension screenshot */}
          <div
            data-media-slot="extension-screenshot"
            className="rotate-1 flex aspect-[4/3] w-full max-w-sm items-center justify-center rounded-2xl border-4 border-black bg-white p-3 shadow-[8px_8px_0px_0px_#000] md:w-1/3"
          >
            <div className="flex h-full w-full items-center justify-center rounded-xl border-4 border-dashed border-black/40 bg-[#fff0f5]">
              <span className="font-loud text-xl text-black/50">📷 your screenshot here</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
