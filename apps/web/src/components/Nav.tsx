import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Menu, X } from "lucide-react";
import { PopButton } from "@neo/ui";

// Nav links shared between the desktop bar and the mobile menu. Anchor links
// (/#how, /#pricing) jump to sections on the landing page; /tools is a real
// route.
const LINKS = [
  { label: "How it works", to: "/#how" },
  { label: "Pricing", to: "/#pricing" },
  { label: "Tools", to: "/tools" },
];

export function Nav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  // Add a drop shadow once the page has scrolled, so the sticky bar lifts off
  // the content instead of blending into it.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 border-b-4 border-black bg-[#fff0f5]/95 backdrop-blur transition-shadow ${
        scrolled ? "shadow-[0px_6px_0px_0px_rgba(0,0,0,0.12)]" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="font-display text-4xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          NEO
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-6 font-accent text-lg text-black md:flex">
          {LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="inline-block transition-transform hover:-translate-y-0.5">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="hidden font-accent text-lg text-black transition-transform hover:-translate-y-0.5 md:inline-block"
          >
            Log in
          </Link>
          <div className="hidden md:block">
            <PopButton
              text="Get started"
              color="#b2ff59"
              icon={Zap}
              variant="panel"
              onClick={() => navigate("/signup")}
            />
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-[#ffe680] shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none md:hidden"
          >
            <Menu className="h-6 w-6 stroke-[3px] text-black" />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-l-4 border-black bg-[#fff0f5] p-6 shadow-2xl">
            <div className="mb-10 flex items-center justify-between">
              <span className="font-display text-3xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">NEO</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-black bg-white shadow-[3px_3px_0px_0px_#000]"
              >
                <X className="h-5 w-5 stroke-[3px] text-black" />
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              {LINKS.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border-2 border-black bg-white px-4 py-3 font-accent text-lg text-black shadow-[3px_3px_0px_0px_#000] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="border border-black/40 bg-white px-4 py-3 font-accent text-lg text-black shadow-[3px_3px_0px_0px_rgba(26,22,15,0.9)] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                Log in
              </Link>
            </nav>
            <div className="mt-auto">
              <PopButton
                text="Get started"
                color="#b2ff59"
                icon={Zap}
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/signup");
                }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
