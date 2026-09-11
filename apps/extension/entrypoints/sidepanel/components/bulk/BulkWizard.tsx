import { useRef, useState } from "react";
import { Step1Inputs } from "./Step1Inputs";
import { Step2SkuForm } from "./Step2SkuForm";
import { assembleProduct, optionalGroupStatus } from "./assemble";
import { generateBulk } from "../../fill";
import { createProduct, type ProductGenomeCreate } from "../../api";
import type { SkuDraft, TemplateSchema } from "./types";

export function BulkWizard() {
  const [schema, setSchema] = useState<TemplateSchema | null>(null);
  const [skus, setSkus] = useState<SkuDraft[]>([]);
  const [index, setIndex] = useState(0);
  const [templateMeta, setTemplateMeta] = useState<{ base64: string; name: string; type: string } | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  // Step 1 hands us schema + skus. We also need the template bytes for generation,
  // so Step1Inputs is asked to pass them through onReady via closure below.
  function handleReady(nextSchema: TemplateSchema, nextSkus: SkuDraft[], meta: { base64: string; name: string; type: string }) {
    setSchema(nextSchema); setSkus(nextSkus); setTemplateMeta(meta); setIndex(0);
  }

  if (!schema) {
    return <Step1InputsBridge onReady={handleReady} />;
  }

  const sku = skus[index];
  const previous = index > 0 ? (skus[index - 1] ?? null) : null;

  if (!sku) {
    return <p className="p-4 font-cartoon text-xs text-black/60">No SKUs to show.</p>;
  }

  function updateSku(next: SkuDraft) {
    setSkus((cur) => cur.map((s, i) => (i === index ? next : s)));
  }

  async function generate() {
    if (!templateMeta || !schema) return;
    setBusy(true); setStatus("Generating Meesho Excel…");
    try {
      // Enforce the optional-field all-or-nothing rule (spec §6.3) before we
      // hand rows to the engine: each variant's measurement set must be fully
      // filled or fully empty, never partial (Meesho QC rejects partial groups).
      const measurementCols = schema.columns.filter((c) =>
        ["bust_size", "waist_size", "shoulder_size", "hip_size", "size_length", "length_size"].includes(c.field),
      );
      if (measurementCols.length) {
        for (const [si, s] of skus.entries()) {
          for (const [vi, v] of s.variants.entries()) {
            if (optionalGroupStatus(v.measurements, measurementCols) === "partial") {
              setStatus(`SKU ${si + 1}, variant ${vi + 1}: fill all measurement fields or leave them all blank.`);
              setIndex(si);
              return;
            }
          }
        }
      }

      const products = skus.map((s, i) => assembleProduct(s, i));
      const res = await generateBulk(templateMeta.base64, templateMeta.name, templateMeta.type, products);
      if (!res.success) {
        setStatus(res.error || (res.validationProblems ?? []).map((p) => `Row ${p.row} — ${p.field}: ${p.error}`).join("\n") || "Generation failed.");
        return;
      }
      if (res.blobBytes) {
        const blob = new Blob([res.blobBytes], { type: res.blobType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = res.filename || "Project-Neo-Meesho-Bulk.xlsx";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      // Save each SKU to Manage Catalogue (best-effort; never blocks the download).
      for (const [i, s] of skus.entries()) {
        try {
          const p = assembleProduct(s, i);
          const payload: Partial<ProductGenomeCreate> = {
            sku: String(s.shared.sku_id ?? s.shared.product_id_style_id ?? `BULK-${Date.now()}-${i}`),
            title: String(s.shared.product_name ?? "Untitled"),
            category: String(s.shared.category ?? ""),
            images: [s.imageUrl],
            attributes: p.attributes,
          };
          await createProduct(payload);
        } catch { /* best-effort */ }
      }
      setStatus(`Done — ${res.rows ?? products.length} row(s) generated. Saved to Manage Catalogue.`);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const isLast = index === skus.length - 1;

  return (
    <div className="p-4">
      <p className="mb-2 font-cartoon text-xs text-black/60">SKU {index + 1} of {skus.length}</p>
      <Step2SkuForm schema={schema} sku={sku} previous={previous} skuNumber={index + 1} onChange={updateSku} />
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}
          className="rounded-lg border-2 border-black px-3 py-2 font-cartoon text-xs font-semibold disabled:opacity-40">← Back</button>
        {!isLast ? (
          <button type="button" onClick={() => setIndex((i) => i + 1)}
            className="rounded-lg border-2 border-black bg-[#8bd3ff] px-3 py-2 font-cartoon text-xs font-semibold">Next →</button>
        ) : (
          <button type="button" disabled={busy} onClick={generate}
            className="rounded-lg border-2 border-black bg-[#ffeb3b] px-3 py-2 font-cartoon text-xs font-bold shadow-[3px_3px_0px_0px_#000] disabled:opacity-50">
            {busy ? "Generating…" : "Generate Meesho Excel"}</button>
        )}
      </div>
      {status && <p className="mt-2 whitespace-pre-wrap font-cartoon text-xs text-black/70">{status}</p>}
    </div>
  );
}

// Adapts Step1Inputs (which returns schema+skus) to also surface the template
// bytes needed later for generation.
function Step1InputsBridge(props: {
  onReady: (schema: TemplateSchema, skus: SkuDraft[], meta: { base64: string; name: string; type: string }) => void;
}) {
  const metaRef = useRef<{ base64: string; name: string; type: string } | null>(null);
  return (
    <Step1Inputs
      onReady={(schema, skus) => {
        if (metaRef.current) props.onReady(schema, skus, metaRef.current);
      }}
      onTemplateBytes={(meta) => { metaRef.current = meta; }}
    />
  );
}
