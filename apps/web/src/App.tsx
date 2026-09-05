import { useEffect, type ReactElement } from "react";
import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { CookieBanner } from "./components/CookieBanner";
import { MobileCta } from "./components/MobileCta";
import { Seo } from "./components/Seo";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { ToolsIndex } from "./pages/tools/ToolsIndex";
import { ProfitCalculator } from "./pages/tools/ProfitCalculator";
import { GstCalculator } from "./pages/tools/GstCalculator";
import { LabelCrop } from "./pages/tools/LabelCrop";
import { LabelMerge } from "./pages/tools/LabelMerge";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { Contact } from "./pages/Contact";
import { ThankYou } from "./pages/ThankYou";
import { NotFound } from "./pages/NotFound";
import { Inventory } from "./pages/Inventory";

// Shared chrome (nav, footer, cookie banner) wraps every normal route via
// <Outlet/>. The 404 route sits OUTSIDE this layout so it can render full-bleed
// with its own self-contained nav and no site footer.
// Scroll behaviour on navigation. Two cases:
//  - With a #hash (e.g. /#pricing from the nav): smooth-scroll that section into
//    view, retrying briefly because scroll-reveal sections can still be settling
//    their height on first paint.
//  - Without a hash (a real page change): instead of the browser's instant jump,
//    keep the current scroll position while the new page swaps in, then smoothly
//    animate back up to the top — so navigating reads as a glide-to-top, not a cut.
function ScrollToHash() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      const tick = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (tries++ < 10) {
          setTimeout(tick, 60);
        }
      };
      tick();
      return;
    }
    // Real page change: React Router keeps the old scroll position, so the new
    // page mounts already scrolled down (clamped to its own height). Defer a
    // frame so it has painted, then smoothly glide up to the top — the "scroll
    // back to the top" transition, always ending at 0.
    const raf = requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    return () => cancelAnimationFrame(raf);
  }, [hash, pathname]);
  return null;
}

function SiteLayout() {
  return (
    <div className="site-canvas min-h-screen text-black font-cartoon">
      {/* Immersive edge vignette — pointer-events:none overlay, see styles.css */}
      <div className="site-vignette" aria-hidden="true" />
      <ScrollToHash />
      <Nav />
      <Outlet />
      <Footer />
      <MobileCta />
      <CookieBanner />
    </div>
  );
}

// Wrap a page with its per-route document metadata. React 19 hoists the <title>
// and <meta> that <Seo> renders into <head>, so keeping the SEO copy here means
// every route's title/description lives in one place instead of scattered across
// page files. Keep these paths in sync with public/sitemap.xml.
function page(path: string, title: string, description: string, element: ReactElement) {
  return (
    <>
      <Seo path={path} title={title} description={description} />
      {element}
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route
          path="/"
          element={page(
            "/",
            "Neo — the compiler for your catalogue",
            "Neo turns one canonical Product Genome into a Meesho-, Amazon-, and Flipkart-ready listing. Reversible, dry-run-first, built for Indian e-commerce sellers.",
            <Landing />,
          )}
        />
        <Route
          path="/login"
          element={page("/login", "Log in — Neo", "Log in to your Neo account to compose, price, and autofill your listings.", <Login initialMode="login" />)}
        />
        <Route
          path="/signup"
          element={page("/signup", "Sign up — Neo", "Create your Neo account — one login for the website and the extension.", <Login initialMode="signup" />)}
        />
        
        {/* === NEW INVENTORY ROUTE === */}
        <Route
          path="/inventory"
          element={page(
            "/inventory",
            "Inventory — Neo",
            "View and manage your saved Product Genomes.",
            <Inventory />,
          )}
        />

        {/* V3 */}
        <Route
          path="/tools"
          element={page(
            "/tools",
            "Free Seller Tools — Neo",
            "Free calculators and PDF label tools for online sellers. No signup, no upload — everything runs in your browser.",
            <ToolsIndex />,
          )}
        />
        <Route
          path="/tools/profit-calculator"
          element={page(
            "/tools/profit-calculator",
            "Profit & Breakeven Calculator — Neo",
            "Work out your real per-order margin after GST, packaging, shipping, and returns — free and instant.",
            <ProfitCalculator />,
          )}
        />
        <Route
          path="/tools/gst-calculator"
          element={page(
            "/tools/gst-calculator",
            "GST Calculator — Neo",
            "Split any amount into base plus CGST/SGST or IGST, either way round. Free GST calculator for Indian sellers.",
            <GstCalculator />,
          )}
        />
        <Route
          path="/tools/label-crop"
          element={page(
            "/tools/label-crop",
            "Shipping Label Crop — Neo",
            "Trim courier PDF labels down to just the label. Runs entirely in your browser — no upload.",
            <LabelCrop />,
          )}
        />
        <Route
          path="/tools/label-merge"
          element={page(
            "/tools/label-merge",
            "Label Merge for A4 — Neo",
            "Combine 2 to 8 shipping labels per A4 sheet for cheaper, faster printing. Free and private, in-browser.",
            <LabelMerge />,
          )}
        />
        {/* V8 */}
        <Route
          path="/privacy"
          element={page("/privacy", "Privacy Policy — Neo", "How Neo collects, uses, and protects your data. Local-first tools, no data selling.", <Privacy />)}
        />
        <Route
          path="/terms"
          element={page("/terms", "Terms of Service — Neo", "The terms for using Neo, including the free trial and our account-safety rules.", <Terms />)}
        />
        <Route
          path="/contact"
          element={page("/contact", "Contact Us — Neo", "Questions, feedback, or need a hand getting set up? Here's how to reach the Neo team.", <Contact />)}
        />
        <Route
          path="/thank-you"
          element={page("/thank-you", "You're In — Neo", "Your Neo trial is ready. Here's what to do next.", <ThankYou />)}
        />
      </Route>
      {/* V11 — full-bleed 404, outside SiteLayout (own nav, no site footer). */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}