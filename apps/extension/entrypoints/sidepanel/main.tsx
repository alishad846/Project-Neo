import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AIAutofill } from "./components/AIAutofill";
import { BusinessDetails } from "./components/BusinessDetails";
import { Header } from "./components/Header";
import { AuthGate } from "./components/AuthGate";
import { clearToken } from "./auth";
import "./style.css";

async function handleLogout() {
  await clearToken();
  window.location.reload();
}

function App() {
  const [tab, setTab] = useState<"details" | "autofill">("autofill");
  return (
    <div className="min-h-screen bg-[#fff0f5]">
      <Header onLogout={handleLogout} />
      <nav className="flex gap-2 border-b-4 border-black bg-white px-3 py-2">
        <button
          onClick={() => setTab("autofill")}
          className={`flex-1 rounded-lg border-2 border-black px-3 py-2 font-cartoon text-xs font-semibold transition-all ${
            tab === "autofill" ? "bg-[#ff90e8] shadow-[3px_3px_0px_0px_#000] -translate-y-0.5" : "bg-white"
          }`}
        >
          AI Autofill
        </button>
        <button
          onClick={() => setTab("details")}
          className={`flex-1 rounded-lg border-2 border-black px-3 py-2 font-cartoon text-xs font-semibold transition-all ${
            tab === "details" ? "bg-[#b2ff59] shadow-[3px_3px_0px_0px_#000] -translate-y-0.5" : "bg-white"
          }`}
        >
          Business Details
        </button>
      </nav>
      {/* Both tabs stay mounted so an in-progress autofill draft or unsaved
          business-details edits survive a tab switch. */}
      <div style={{ display: tab === "autofill" ? "block" : "none" }}><AIAutofill /></div>
      <div style={{ display: tab === "details" ? "block" : "none" }}><BusinessDetails /></div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthGate>
      <App />
    </AuthGate>
  </QueryClientProvider>
);
