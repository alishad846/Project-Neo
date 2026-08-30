import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { PriceManager } from "./components/PriceManager";
import { Catalogue } from "./components/Catalogue";
import "./style.css";

function App() {
  const [tab, setTab] =
    useState<"catalogue" | "pricing">("catalogue");

  return (
    <div>
      <nav
        style={{
          display: "flex",
          borderBottom: "1px solid #ddd",
        }}
      >
        <button
          onClick={() => setTab("catalogue")}
          style={{
            flex: 1,
            padding: 10,
            fontWeight:
              tab === "catalogue" ? 700 : 400,
          }}
        >
          Catalogue
        </button>

        <button
          onClick={() => setTab("pricing")}
          style={{
            flex: 1,
            padding: 10,
            fontWeight:
              tab === "pricing" ? 700 : 400,
          }}
        >
          Price Manager
        </button>
      </nav>

      <div
        style={{
          display:
            tab === "catalogue" ? "block" : "none",
        }}
      >
        <Catalogue />
      </div>

      <div
        style={{
          display:
            tab === "pricing" ? "block" : "none",
        }}
      >
        <PriceManager />
      </div>
    </div>
  );
}

createRoot(
  document.getElementById("root")!
).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);