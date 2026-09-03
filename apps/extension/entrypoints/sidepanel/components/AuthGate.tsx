import React, { useEffect, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { PopButton } from "@neo/ui";
import { getToken, login, signup } from "../auth";

const inputClass =
  "rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs w-full";

type Mode = "login" | "signup";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getToken()
      .then((t) => {
        if (!cancelled) setAuthed(Boolean(t));
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await signup({ fullName, shopName, email, password });
      }
      setAuthed(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff0f5]">
        <p className="rounded-full border-2 border-black bg-white px-4 py-2 font-cartoon text-xs font-semibold shadow-[3px_3px_0px_0px_#000]">
          Waking Neo up…
        </p>
      </div>
    );
  }

  if (authed) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fff0f5] p-4">
      <div className="w-full max-w-[320px] rounded-2xl border-4 border-black bg-white p-4 shadow-[8px_8px_0px_0px_#000]">
        <h1 className="font-loud text-2xl tracking-wide text-black [-webkit-text-stroke:1px_black] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          WELCOME TO NEO
        </h1>
        <p className="mt-1 font-cartoon text-xs text-black/60">
          {mode === "login" ? "Log in to keep compiling your catalogue." : "Create a seller account to get started."}
        </p>

        <div className="mt-3 flex gap-2 rounded-lg border-2 border-black bg-[#fff0f5] p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(null); }}
            className={`flex-1 rounded-md px-2 py-1 font-cartoon text-xs font-semibold transition-all ${
              mode === "login" ? "bg-[#00e5ff] shadow-[2px_2px_0px_0px_#000]" : ""
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 rounded-md px-2 py-1 font-cartoon text-xs font-semibold transition-all ${
              mode === "signup" ? "bg-[#b2ff59] shadow-[2px_2px_0px_0px_#000]" : ""
            }`}
          >
            Sign up
          </button>
        </div>

        <form
          className="mt-3 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {mode === "signup" && (
            <>
              <label className="font-cartoon text-xs font-semibold">
                Full name
                <input
                  className={`${inputClass} mt-1`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>
              <label className="font-cartoon text-xs font-semibold">
                Shop name
                <input
                  className={`${inputClass} mt-1`}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                />
              </label>
            </>
          )}
          <label className="font-cartoon text-xs font-semibold">
            Email
            <input
              className={`${inputClass} mt-1`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="font-cartoon text-xs font-semibold">
            Password
            <input
              className={`${inputClass} mt-1`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="rounded-full border-2 border-black bg-[#ffcdd2] px-3 py-1 font-cartoon text-[11px] font-semibold text-red-800">
              {error}
            </p>
          )}

          <div className="mt-1 flex justify-center">
            <PopButton
              text={busy ? "…" : mode === "login" ? "Log in" : "Create account"}
              color={mode === "login" ? "#00e5ff" : "#b2ff59"}
              icon={mode === "login" ? LogIn : UserPlus}
              onClick={() => { if (!busy) handleSubmit(); }}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
