import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface ToolPageLayoutProps {
  title: string;
  // Rendered in .font-body right after the title, for any digits the title
  // needs (e.g. "(A4)") — .font-display (Whoa Sauce) has no digit glyphs, so
  // mixing a number into that span makes the browser fall back to a system
  // font mid-word, which reads as a rendering glitch.
  titleSuffix?: string;
  intro: string;
  children: ReactNode;
}

// Shared shell for every /tools/* page: calm grainy background, a display
// heading (letters only — Whoa Sauce has no digit glyphs), a short intro in
// the body font, a white comic panel for the actual tool UI (numbers/results
// need to stay legible, not sit on a busy illustration), and a back link.
export function ToolPageLayout({ title, titleSuffix, intro, children }: ToolPageLayoutProps) {
  return (
    <main className="grain-pink min-h-screen px-4 py-10 md:px-6 md:py-16">
      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          to="/tools"
          className="mb-6 inline-flex items-center gap-1.5 font-accent text-sm text-black hover:-translate-y-0.5 transition-transform"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3px]" />
          All tools
        </Link>

        <h1 className="font-display text-4xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] md:text-5xl">
          {title}
          {titleSuffix && (
            <span className="font-body ml-2 align-middle text-2xl text-black md:text-3xl">{titleSuffix}</span>
          )}
        </h1>
        <p className="mt-3 max-w-xl font-body text-base text-black/80">{intro}</p>

        <div className="mt-8 rounded-2xl border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] md:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
