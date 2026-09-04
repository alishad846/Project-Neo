import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, X } from "lucide-react";

// Custom 404. Adapted from the user's TinyTrails 404 spec, re-branded to Neo.
// Deliberately self-contained and visually isolated from the rest of the site:
// it uses Inter (not the cartoon display faces) and a full-bleed orange gradient
// so nothing here leaks into the marketing theme. The centre clip is an EXTERNAL
// video — kept as a single replaceable const with a graceful gradient fallback
// if it fails to load (offline, blocked, or swapped for a Neo asset later).
//
// TODO(open question): replace VIDEO_SRC with a Neo-owned asset, or drop it.
const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4";

const INTER = "'Inter', system-ui, -apple-system, sans-serif";

const NAV_LINKS = [
  { label: "Pricing", to: "/#pricing" },
  { label: "Tools", to: "/tools" },
  { label: "Contact", to: "/contact" },
];

export function NotFound() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // The giant background "404" is stretched vertically to roughly fill the
  // viewport: measure its natural height, then scaleY = (innerHeight / height)
  // * 1.4 so the digits read as a tall backdrop rather than body-sized text.
  const digitsRef = useRef<HTMLDivElement>(null);
  const [scaleY, setScaleY] = useState(1);

  useLayoutEffect(() => {
    function measure() {
      const el = digitsRef.current;
      if (!el) return;
      const naturalHeight = el.offsetHeight;
      if (naturalHeight > 0) {
        setScaleY((window.innerHeight / naturalHeight) * 1.4);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Lock body scroll while the mobile menu overlay is open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div
      className="relative h-screen w-full overflow-hidden text-white"
      style={{ background: "linear-gradient(160deg, #FF8233 0%, #FDAC55 100%)", fontFamily: INTER }}
    >
      {/* Do not index the 404 page. */}
      <title>Page Not Found — Neo</title>
      <meta name="robots" content="noindex" />

      {/* Giant stretched "404" backdrop with a soft white oval glow and a fade
          toward the bottom so the foreground content stays readable. */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center" aria-hidden="true">
        <div
          className="absolute h-[60vh] w-[60vh] rounded-full bg-white/25 blur-3xl"
          style={{ filter: "blur(80px)" }}
        />
        <div
          ref={digitsRef}
          className="select-none font-black leading-none text-white/90"
          style={{
            fontSize: "22vh",
            transform: `scale(1.15, ${scaleY})`,
            transformOrigin: "center",
          }}
        >
          404
        </div>
        {/* Mask fade toward the bottom edge. */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(255,130,51,0.85) 95%)",
            opacity: 0.8,
          }}
        />
      </div>

      {/* Top nav */}
      <header className="relative z-20 flex items-center justify-between px-5 py-5 md:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="Neo home">
          <span className="grid grid-cols-2 gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-2.5 w-2.5 rounded-full bg-white" />
            ))}
          </span>
          <span className="text-2xl font-bold tracking-tight">Neo</span>
        </Link>

        {/* Desktop pill links */}
        <nav className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/20"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white md:hidden"
          style={{ backgroundColor: "#F16524" }}
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Center video (or gradient fallback on error). */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        {!videoFailed && (
          <video
            src={VIDEO_SRC}
            autoPlay
            loop
            muted
            playsInline
            aria-label="Animated 404 illustration"
            onError={() => setVideoFailed(true)}
            className="h-[46vh] w-[46vh] max-w-[90vw] object-contain mix-blend-darken"
          />
        )}
      </div>

      {/* Bottom message + back-home pill */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-5 px-6 pb-14 text-center">
        <p className="text-lg font-medium text-white md:text-xl">Oops, something went wrong!</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: "#F16524" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div
            className="absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col p-6 text-white shadow-2xl"
            style={{ background: "linear-gradient(160deg, #FF6B1A 0%, #FF9642 100%)" }}
          >
            <div className="mb-10 flex items-center justify-between">
              <span className="text-xl font-bold">Neo</span>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link, i) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="animate-[pop-in-fade_0.4s_ease-out_forwards] rounded-xl px-4 py-3 text-lg font-medium text-white opacity-0 transition-colors hover:bg-white/20"
                  style={{ animationDelay: `${150 + i * 60}ms` }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold"
              style={{ color: "#F16524" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
