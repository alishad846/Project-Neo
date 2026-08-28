import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { getProducts } from "./api";
import { PriceManager } from "./components/PriceManager";
import "./style.css";

function Catalogue() {
  const { data, isLoading, error } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  if (isLoading) return <p style={{ padding: 16 }}>Loading catalogue…</p>;
  if (error) return <p style={{ padding: 16 }}>Could not reach backend on :3000.</p>;
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Catalogue ({data?.length ?? 0})</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {data?.map((p) => (
          <li key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
            <strong>{p.title ?? p.sku}</strong>
            <div style={{ fontSize: 12, color: "#666" }}>{p.category} · {p.colour} · ₹{p.sellingPrice}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState<"catalogue" | "pricing">("catalogue");
  return (
    <div>
      <nav style={{ display: "flex", borderBottom: "1px solid #ddd" }}>
        <button onClick={() => setTab("catalogue")} style={{ flex: 1, padding: 10, fontWeight: tab === "catalogue" ? 700 : 400 }}>Catalogue</button>
        <button onClick={() => setTab("pricing")} style={{ flex: 1, padding: 10, fontWeight: tab === "pricing" ? 700 : 400 }}>Price Manager</button>
      </nav>
      {/* Both tabs stay mounted so switching tabs never discards Price Manager's
          in-progress preview or an applied-but-not-yet-reverted transaction. */}
      <div style={{ display: tab === "catalogue" ? "block" : "none" }}><Catalogue /></div>
      <div style={{ display: tab === "pricing" ? "block" : "none" }}><PriceManager /></div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
