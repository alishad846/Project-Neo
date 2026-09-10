// apps/extension/entrypoints/sidepanel/components/bulk/Step1Inputs.tsx
import { useState } from "react";
import { inspectTemplate } from "../../fill";
import { extractFromUrl } from "../../api";
import { mapPrefillToSchema } from "./assemble";
import type { SkuDraft, TemplateSchema } from "./types";

const inputClass = "mt-1 w-full rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const out = reader.result as string;
      resolve(out.split(",")[1] ?? out);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function Step1Inputs(props: {
  onReady: (schema: TemplateSchema, skus: SkuDraft[]) => void;
  onTemplateBytes?: (meta: { base64: string; name: string; type: string }) => void;
}) {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [linksText, setLinksText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [badLinks, setBadLinks] = useState<string[]>([]);

  async function proceed() {
    setBusy(true); setBadLinks([]); setStatus("");
    try {
      if (!templateFile) { setStatus("Select the Meesho Excel template first."); return; }
      const links = linksText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (!links.length) { setStatus("Paste at least one product image link."); return; }

      setStatus("Reading the template…");
      const base64 = await fileToBase64(templateFile);
      props.onTemplateBytes?.({ base64, name: templateFile.name, type: templateFile.type });
      const schema = await inspectTemplate(base64, templateFile.name, templateFile.type);

      setStatus("Checking image links…");
      const skus: SkuDraft[] = [];
      const failed: string[] = [];
      for (const [i, url] of links.entries()) {
        setStatus(`Checking image ${i + 1} of ${links.length}…`);
        const res = await extractFromUrl(url);
        if (!res.fetchable) { failed.push(url); continue; }
        // Map extracted attributes onto the template's actual field names so
        // prefill lands in the right form fields (neckType→neck, etc.).
        const prefill = mapPrefillToSchema(res.attributes, schema);
        skus.push({
          id: `sku-${i}-${Math.random().toString(36).slice(2)}`,
          imageUrl: url, prefill,
          shared: { ...prefill }, sameAsPrev: {},
          variants: [],
        });
      }

      if (failed.length) {
        setBadLinks(failed);
        setStatus("Some links could not be fetched — fix or replace them, then Continue.");
        return;
      }
      props.onReady(schema, skus);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 p-4">
      <div className="grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <p className="font-accent text-sm text-[#ff90e8]">1. Meesho Excel template</p>
        <input type="file" accept=".xlsx" className={inputClass}
          onChange={(e) => setTemplateFile(e.target.files?.[0] ?? null)} />
      </div>

      <div className="grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <p className="font-accent text-sm text-[#ff90e8]">2. Product image links (one per line = one SKU)</p>
        <textarea className={inputClass} rows={6}
          placeholder="https://upload.meeshosupplyassets.com/cataloging/.../a.png"
          value={linksText} onChange={(e) => setLinksText(e.target.value)} />
      </div>

      {badLinks.length > 0 && (
        <div className="rounded-lg border-2 border-black bg-[#ffe0e0] p-2 font-cartoon text-xs">
          Could not fetch:
          <ul className="mt-1 list-disc pl-4">{badLinks.map((l) => <li key={l} className="break-all">{l}</li>)}</ul>
        </div>
      )}

      <button type="button" disabled={busy} onClick={proceed}
        className="rounded-lg border-2 border-black bg-[#ffeb3b] px-3 py-2 font-cartoon text-sm font-bold shadow-[3px_3px_0px_0px_#000] disabled:opacity-50">
        {busy ? "Working…" : "Continue →"}
      </button>
      {status && <p className="font-cartoon text-xs text-black/70">{status}</p>}
    </div>
  );
}
