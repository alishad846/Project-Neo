import { Link } from "react-router-dom";
import { Mail, Instagram, Twitter } from "lucide-react";

// Sitewide footer. Rendered once in App below every route. Brand + short pitch,
// three nav columns, contact email, social placeholders, and copyright. Socials
// point to "#" until real handles exist (TODO) — kept as buttons so the layout
// is final and only the href needs swapping.
const NAV_LINKS = [
  { label: "How it works", to: "/#how" },
  { label: "Pricing", to: "/#pricing" },
  { label: "Free tools", to: "/tools" },
  { label: "Demo form", to: "/demo" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Contact", to: "/contact" },
];

// TODO: replace "#" with real social handles once they exist.
const SOCIALS = [
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "Twitter / X", href: "#", icon: Twitter },
];

export function Footer() {
  return (
    <footer id="site-footer" className="border-t-4 border-black bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        {/* Brand + pitch */}
        <div className="md:col-span-1">
          <Link
            to="/"
            className="font-display text-4xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(255,255,255,0.9)]"
          >
            NEO
          </Link>
          <p className="mt-3 max-w-xs font-body text-sm text-white/70">
            One catalog, every marketplace. Compose, price, and list — reversibly, and always in your
            control.
          </p>
        </div>

        {/* Product nav */}
        <nav aria-label="Footer product links">
          <h3 className="mb-4 font-accent text-lg text-[#b2ff59]">Product</h3>
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="font-body text-sm text-white/80 underline-offset-2 hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Legal nav */}
        <nav aria-label="Footer legal links">
          <h3 className="mb-4 font-accent text-lg text-[#b2ff59]">Company</h3>
          <ul className="flex flex-col gap-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="font-body text-sm text-white/80 underline-offset-2 hover:text-white hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact + socials */}
        <div>
          <h3 className="mb-4 font-accent text-lg text-[#b2ff59]">Say hello</h3>
          {/* TODO: real support email */}
          <a
            href="mailto:hello@neo.example"
            className="inline-flex items-center gap-2 font-body text-sm text-white/80 hover:text-white"
          >
            <Mail className="h-4 w-4 stroke-[3px]" />
            hello@neo.example
          </a>
          <div className="mt-5 flex gap-3">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-white/40 text-white/80 transition-colors hover:border-white hover:text-white"
              >
                <social.icon className="h-5 w-5 stroke-[3px]" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t-2 border-white/20 px-6 py-5">
        <p className="mx-auto max-w-6xl font-body text-xs text-white/50">
          © {COPYRIGHT_YEAR} Neo. All rights reserved. Launch preview — details subject to change.
        </p>
      </div>
    </footer>
  );
}

// Static build-time year. new Date() is avoided intentionally in code that runs
// at module scope in some environments; a plain constant is fine here and keeps
// the footer deterministic. TODO: bump on major release.
const COPYRIGHT_YEAR = 2026;
