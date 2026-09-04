import { Link } from "react-router-dom";
import { PartyPopper, ArrowRight } from "lucide-react";
import { PopButton } from "@neo/ui";

// Post-signup / trial-start confirmation. The site's "Start 7-day trial" CTAs
// route here (there's no real signup form on the marketing site yet — auth
// lives in the extension), so this is the honest "you're in, here's what's next"
// landing. Kept upbeat and short.
export function ThankYou() {
  return (
    <main className="grain-yellow flex min-h-screen items-center justify-center px-4 py-16">
      <div className="relative z-10 mx-auto max-w-xl rounded-2xl border-4 border-black bg-white p-8 text-center shadow-[8px_8px_0px_0px_#000] md:p-12">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-black bg-[#b2ff59]">
          <PartyPopper className="h-8 w-8 stroke-[3px] text-black" />
        </span>
        <h1 className="font-display text-4xl text-[#ff90e8] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] md:text-5xl">
          You&rsquo;re in!
        </h1>
        <p className="mt-4 font-body text-base text-black/80">
          Your 7-day trial is ready. Next step: install the Neo extension, sign in, and let it fill
          your first listing for you — you always review and confirm before anything goes live.
        </p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Link to="/tools">
            <PopButton text="Explore the free tools" color="#ffe680" icon={ArrowRight} />
          </Link>
          <Link
            to="/"
            className="font-body text-sm text-black underline decoration-2 underline-offset-2 hover:text-[#ff90e8]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
