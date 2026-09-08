import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AIAutofill } from "./components/AIAutofill";
import { BusinessDetails } from "./components/BusinessDetails";
import { ProfitCalculator } from "./components/ProfitCalculator";
import { GstCalculator } from "./components/GstCalculator";
import { Header } from "./components/Header";
import { AddProduct } from "./components/AddProduct";
import { AuthGate } from "./components/AuthGate";
import { clearToken } from "./auth";
import "./style.css";

async function handleLogout() {
  await clearToken();
  window.location.reload();
}

const SECTIONS = [
  { id: "autofill", label: "AI Autofill", color: "#ff90e8", node: <AIAutofill /> },
  { id: "add-product", label: "Add Product", color: "#8bd3ff", node: <AddProduct /> },
  { id: "details", label: "Business Details", color: "#b2ff59", node: <BusinessDetails /> },
  { id: "profit", label: "Profit Calc", color: "#00e5ff", node: <ProfitCalculator /> },
  { id: "gst", label: "GST Calc", color: "#ffeb3b", node: <GstCalculator /> },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

function App() {
  const [tab, setTab] = useState<SectionId>("autofill");
  return (
    <div className="min-h-screen bg-[#fff0f5]">
      <Header onLogout={handleLogout} />
      <nav className="flex gap-2 overflow-x-auto border-b-4 border-black bg-white px-3 py-2">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setTab(section.id)}
            className={`shrink-0 whitespace-nowrap rounded-lg border-2 border-black px-3 py-2 font-cartoon text-xs font-semibold transition-all ${
              tab === section.id ? "shadow-[3px_3px_0px_0px_#000] -translate-y-0.5" : "bg-white"
            }`}
            style={tab === section.id ? { backgroundColor: section.color } : undefined}
          >
            {section.label}
          </button>
        ))}
      </nav>
      {/* All sections stay mounted so an in-progress autofill draft or unsaved
          business-details / calculator edits survive a tab switch. */}
      {SECTIONS.map((section) => (
        <div key={section.id} style={{ display: tab === section.id ? "block" : "none" }}>
          {section.node}
        </div>
      ))}
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
