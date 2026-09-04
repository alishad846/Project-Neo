import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, UserPlus, Store, Mail, Lock, User, Loader2 } from "lucide-react";
import { PopButton } from "@neo/ui";
import { login, signup } from "../lib/auth";

type Mode = "login" | "signup";

// Cartoonish login / signup. One account, created here against the backend's
// Postgres `sellers` table, is the same account the Neo extension unlocks with —
// that shared table is the wall: only accounts made through Neo work downstream.
export function Login({ initialMode = "login" }: { initialMode?: Mode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = isSignup
        ? await signup({ fullName, shopName, email, password })
        : await login({ email, password });
      navigate("/thank-you", { state: { name: user.fullName } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <main className="comic-cream flex min-h-screen items-center justify-center px-4 py-16">
      <div className="relative z-10 w-full max-w-md">
        <h1 className="mb-2 text-center font-display text-5xl text-black heading-pop-pink md:text-6xl">
          {isSignup ? "JOIN NEO." : "WELCOME BACK."}
        </h1>
        <p className="mb-8 text-center font-body text-base text-black/70">
          One account for the website and the extension.
        </p>

        {/* Mode toggle */}
        <div className="mb-6 flex border border-black/40 bg-white p-1 shadow-[4px_4px_0px_0px_rgba(26,22,15,0.9)]">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`flex-1 px-4 py-2 font-body text-sm font-bold uppercase tracking-wide transition-colors ${
                mode === m ? "bg-[#ffc93c] text-black" : "bg-transparent text-black/50 hover:text-black"
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 border border-black/40 bg-white p-6 shadow-[8px_8px_0px_0px_rgba(26,22,15,0.9)] md:p-8"
        >
          {isSignup && (
            <>
              <Field icon={User} label="Full name" value={fullName} onChange={setFullName} placeholder="Asha Verma" autoComplete="name" />
              <Field icon={Store} label="Shop name" value={shopName} onChange={setShopName} placeholder="Asha Fashions" autoComplete="organization" />
            </>
          )}
          <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@shop.com" autoComplete="email" />
          <Field
            icon={Lock}
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />

          {error && (
            <p className="border border-red-500/60 bg-red-100 px-3 py-2 font-body text-sm font-semibold text-red-700">
              {error}
            </p>
          )}

          <div className="mt-2">
            <PopButton
              text={busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
              color="#b2ff59"
              icon={busy ? Loader2 : isSignup ? UserPlus : LogIn}
              disabled={busy}
            />
          </div>

          <p className="text-center font-body text-sm text-black/60">
            {isSignup ? (
              <>
                Already with Neo?{" "}
                <button type="button" onClick={() => switchMode("login")} className="font-bold text-[#ff2fb0] underline underline-offset-2">
                  Log in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-bold text-[#ff2fb0] underline underline-offset-2">
                  Create an account
                </button>
              </>
            )}
          </p>
        </form>

        <p className="mt-6 text-center font-body text-sm text-black/50">
          <Link to="/" className="underline underline-offset-2 hover:text-[#ff2fb0]">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

// A single labelled, icon-led input styled to match the square comic theme. The
// PopButton submit handles its own font; inputs use the legible body font.
function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-body text-sm font-bold uppercase tracking-wide text-black/70">{label}</span>
      <span className="flex items-center gap-2 border border-black/40 bg-[#fff7fb] px-3 shadow-[3px_3px_0px_0px_rgba(26,22,15,0.85)] focus-within:bg-white">
        <Icon className="h-4 w-4 shrink-0 stroke-[3px] text-black/50" />
        <input
          required
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent py-2.5 font-body text-base text-black outline-none placeholder:text-black/35"
        />
      </span>
    </label>
  );
}
