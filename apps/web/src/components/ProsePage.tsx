import type { ReactNode } from "react";

interface ProsePageProps {
  title: string;
  // Digits in a title must live in .font-body — Whoa Sauce (.font-display) has
  // no digit glyphs, so a number inside that span falls back to a system font
  // mid-heading and reads as a rendering glitch. (Same rule as ToolPageLayout.)
  titleSuffix?: string;
  intro?: string;
  children: ReactNode;
}

// Shared shell for calm, text-heavy pages (legal + info): a grainy tint instead
// of a busy comic image so body copy stays legible, a display heading, and a
// white comic panel holding the prose. Kept deliberately quiet — these pages
// are read, not scrolled past.
export function ProsePage({ title, titleSuffix, intro, children }: ProsePageProps) {
  return (
    <main className="grain-pink min-h-screen px-4 py-10 md:px-6 md:py-16">
      <div className="relative z-10 mx-auto max-w-3xl">
        <h1 className="font-display text-4xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] md:text-5xl">
          {title}
          {titleSuffix && (
            <span className="font-body ml-2 align-middle text-2xl text-black md:text-3xl">{titleSuffix}</span>
          )}
        </h1>
        {intro && <p className="mt-3 max-w-xl font-body text-base text-black/80">{intro}</p>}

        <div className="mt-8 rounded-2xl border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_#000] md:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}

// Small typographic helpers so every legal/info page renders headings and body
// copy identically without repeating the same Tailwind strings on each line.
export function ProseHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 mt-8 font-accent text-2xl text-black first:mt-0">{children}</h2>;
}

export function ProseText({ children }: { children: ReactNode }) {
  return <p className="mb-4 font-body text-base leading-relaxed text-black/80">{children}</p>;
}
