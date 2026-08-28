import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { getProducts } from "./api";
import "./style.css";

function Catalogue() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  if (isLoading) return <p style={{ padding: 16 }}>Loading catalogue…</p>;
  if (error) return <p style={{ padding: 16 }}>Could not reach backend on :3000.</p>;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 600 }}>Catalogue ({data?.length ?? 0})</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {data?.map((p) => (
          <li key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
            <strong>{p.title ?? p.sku}</strong>
            <div style={{ fontSize: 12, color: "#666" }}>
              {p.category} · {p.colour} · ₹{p.sellingPrice}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Catalogue />
  </QueryClientProvider>
);
