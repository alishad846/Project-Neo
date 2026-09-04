import type { ReactElement } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import { CookieBanner } from "./components/CookieBanner";
import { Seo } from "./components/Seo";
import { Landing } from "./pages/Landing";
import { Demo } from "./pages/Demo";
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

// Shared chrome (nav, footer, cookie banner) wraps every normal route via
// <Outlet/>. The 404 route sits OUTSIDE this layout so it can render full-bleed
// with its own self-contained nav and no site footer.
function SiteLayout() {
  return (
    <div className="bg-[#fff0f5] text-black font-cartoon">
      <Nav />
      <Outlet />
      <Footer />
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
          path="/demo"
          element={page(
            "/demo",
            "Live Autofill Demo — Neo",
            "Try Neo's autofill on a safe practice form. See how one product genome fills a marketplace listing in seconds — you always review before submit.",
            <Demo />,
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
