import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { getProducts } from "./api";
import { PriceManager } from "./components/PriceManager";
import { AIComposer } from "./components/AIComposer";
import { Header } from "./components/Header";
import "./style.css";

function Catalogue() {
  const { data, isLoading, error } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  if (isLoading) return <p className="p-4 font-cartoon text-sm">Loading catalogue…</p>;
  if (error) return <p className="p-4 font-cartoon text-sm">Could not reach backend on :3000.</p>;
  return (
    <div className="p-4">
      <h2 className="font-loud text-2xl tracking-wide text-black">
        Catalogue <span className="text-[#ff90e8]">({data?.length ?? 0})</span>
      </h2>
      <ul className="mt-3 flex flex-col gap-2">
        {data?.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0px_0px_#000]"
          >
            <strong className="font-cartoon text-sm">{p.title ?? p.sku}</strong>
            <div className="mt-1 font-cartoon text-xs text-black/60">
              {p.category} · {p.colour} · ₹{p.sellingPrice}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<"catalogue" | "pricing" | "composer">("catalogue");
  return (
    <div className="min-h-screen bg-[#fff0f5]">
      <Header />
      <nav className="flex gap-2 border-b-4 border-black bg-white px-3 py-2">
        <button
          onClick={() => setTab("catalogue")}
          className={`flex-1 rounded-lg border-2 border-black px-3 py-2 font-cartoon text-xs font-semibold transition-all ${
            tab === "catalogue"
              ? "bg-[#00e5ff] shadow-[3px_3px_0px_0px_#000] -translate-y-0.5"
              : "bg-white"
          }`}
        >
          Catalogue
        </button>
        <button
          onClick={() => setTab("pricing")}
          className={`flex-1 rounded-lg border-2 border-black px-3 py-2 font-cartoon text-xs font-semibold transition-all ${
            tab === "pricing"
              ? "bg-[#b2ff59] shadow-[3px_3px_0px_0px_#000] -translate-y-0.5"
              : "bg-white"
          }`}
        >
          Price Manager
        </button>
        <button
          onClick={() => setTab("composer")}
          className={`flex-1 rounded-lg border-2 border-black px-3 py-2 font-cartoon text-xs font-semibold transition-all ${
            tab === "composer"
              ? "bg-[#ff90e8] shadow-[3px_3px_0px_0px_#000] -translate-y-0.5"
              : "bg-white"
          }`}
        >
          AI Composer
        </button>
      </nav>
      {/* All three tabs stay mounted so switching tabs never discards Price Manager's
          in-progress preview, an applied-but-not-yet-reverted transaction, or the
          AI Composer's in-progress draft. */}
      <div style={{ display: tab === "catalogue" ? "block" : "none" }}><Catalogue /></div>
      <div style={{ display: tab === "pricing" ? "block" : "none" }}><PriceManager /></div>
      <div style={{ display: tab === "composer" ? "block" : "none" }}><AIComposer /></div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
