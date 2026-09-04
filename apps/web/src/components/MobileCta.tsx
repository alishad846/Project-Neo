import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";

// Sticky bottom "Start 7-day trial" bar for small screens only (hidden at md+).
// It auto-hides when the footer scrolls into view so it never floats over the
// footer's own links/CTAs, and it respects the iOS safe-area inset. Watches the
// element with id="site-footer" (rendered by <Footer>) via IntersectionObserver.
export function MobileCta() {
  const navigate = useNavigate();
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.getElementById("site-footer");
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  if (footerVisible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-black bg-[#fff0f5] px-4 pt-3 md:hidden"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <button
        onClick={() => navigate("/thank-you")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-black bg-[#b2ff59] px-4 py-3 font-body font-bold text-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
      >
        Get started free
        <Zap className="h-5 w-5 stroke-[3px]" />
      </button>
    </div>
  );
}
