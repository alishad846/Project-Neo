import type { ReactNode } from "react";

interface SectionBgProps {
  /** Path to a background image (served from /public), e.g. "/images/Bow.jpg". */
  image?: string;
  /** Default text color for content in this section: "light" = black text
   * (bright/light backgrounds), "dark" = white text (busy/dark backgrounds). */
  tone?: "light" | "dark";
  /** Calm grainy tint to use instead of a busy comic image, for sections
   * with dense text/data or gaps that need a subtle fill. */
  grain?: "pink" | "yellow" | "none";
  /** Adds a soft translucent scrim over the background for extra contrast
   * when content needs to sit directly on a busy/bright area. */
  scrim?: boolean;
  id?: string;
  className?: string;
  /** Overrides the default content container classes entirely. */
  contentClassName?: string;
  children: ReactNode;
}

export function SectionBg({
  image,
  tone = "light",
  grain = "none",
  scrim = false,
  id,
  className = "",
  contentClassName,
  children,
}: SectionBgProps) {
  const grainClass = grain === "pink" ? "grain-pink" : grain === "yellow" ? "grain-yellow" : "";
  const toneClass = tone === "dark" ? "text-white" : "text-black";

  return (
    <section
      id={id}
      className={`relative w-full overflow-hidden py-24 md:py-32 ${grainClass} ${toneClass} ${className}`.trim()}
      style={
        image
          ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {scrim && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              tone === "dark"
                ? "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.15))"
                : "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.35))",
          }}
        />
      )}
      <div className={contentClassName ?? "relative z-10 mx-auto max-w-6xl px-6"}>{children}</div>
    </section>
  );
}
