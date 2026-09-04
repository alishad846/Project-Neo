import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { PopButton } from "@neo/ui";

const STORAGE_KEY = "neo-cookie-consent";

// Bottom cartoonish cookie-consent banner. Shows once until the visitor makes a
// choice; the choice ("accepted" | "declined") is persisted in localStorage so
// it never re-blocks after that. Honest copy: Neo only stores this preference and
// the essentials needed to keep you signed in — there are no ad trackers to gate,
// so "Decline" simply records the preference and dismisses. Links to /privacy.
export function CookieBanner() {
  // Start hidden; decide on mount so SSR/first-paint never flashes the banner
  // for someone who already chose. localStorage is wrapped in try/catch because
  // it throws in private-mode / storage-disabled browsers.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let choice: string | null = null;
    try {
      choice = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable — show the banner but don't crash
    }
    if (!choice) setVisible(true);
  }, []);

  function record(choice: "accepted" | "declined") {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore — worst case the banner shows again next visit
    }
    setVisible(false);
  }

  if (!visible) return null;

  // On mobile the banner sits above the sticky trial bar (bottom-28); on md+
  // there is no trial bar so it returns to bottom-3.
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-28 z-[60] mx-auto max-w-3xl rounded-lg border border-black/40 bg-[#fff0f5] p-5 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)] md:inset-x-0 md:bottom-3 md:p-6"
    >
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-black bg-[#ffe680]">
            <Cookie className="h-5 w-5 stroke-[3px] text-black" />
          </span>
          <p className="font-body text-sm text-black">
            We use only essential cookies to keep you signed in and to remember this choice — no ad
            trackers.{" "}
            <Link to="/privacy" className="underline decoration-2 underline-offset-2 hover:text-[#ff90e8]">
              Read our privacy policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => record("declined")}
            className="rounded-md border border-black/40 bg-white px-4 py-2 font-body text-sm font-semibold text-black shadow-[3px_3px_0px_0px_rgba(26,22,15,0.9)] transition-all hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            Decline
          </button>
          <PopButton text="Accept" color="#b2ff59" icon={Cookie} variant="panel" onClick={() => record("accepted")} />
        </div>
      </div>
    </div>
  );
}
