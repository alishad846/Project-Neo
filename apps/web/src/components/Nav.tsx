import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { PopButton } from "@neo/ui";

export function Nav() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 border-b-4 border-black bg-[#fff0f5]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="font-display text-4xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          NEO
        </Link>
        <nav className="hidden items-center gap-6 font-accent text-lg text-black md:flex">
          <a href="/#how" className="hover:-translate-y-0.5 transition-transform inline-block">
            How it works
          </a>
          <a href="/#pricing" className="hover:-translate-y-0.5 transition-transform inline-block">
            Pricing
          </a>
          {/* V3: this becomes a real /tools/* route */}
          <Link to="/tools" className="hover:-translate-y-0.5 transition-transform inline-block">
            Tools
          </Link>
        </nav>
        <PopButton text="Start 7-day trial" color="#b2ff59" icon={Zap} variant="panel" onClick={() => navigate("/thank-you")} />
      </div>
    </header>
  );
}
