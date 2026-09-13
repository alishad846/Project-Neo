// apps/extension/entrypoints/sidepanel/components/bulk/Step1Inputs.tsx
import { useState } from "react";
import { inspectTemplate } from "../../fill";
import { extractFromUrl } from "../../api";
import { mapPrefillToSchema } from "./assemble";
import { LinkPillInput } from "./LinkPillInput";
import type { SkuDraft, TemplateSchema } from "./types";

const inputClass =
  "mt-1 w-full rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

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
  onTemplateBytes?: (meta: {
    base64: string;
    name: string;
    type: string;
  }) => void;
}) {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [badLinks, setBadLinks] = useState<string[]>([]);

  async function proceed() {
    setBusy(true);
    setBadLinks([]);
    setStatus("");

    try {
      if (!templateFile) {
        setStatus("Select the Meesho Excel template.");
        return;
      }

      if (!links.length) {
        setStatus("Add at least one product image link.");
        return;
      }

      setStatus("Reading template…");

      const base64 = await fileToBase64(templateFile);

      props.onTemplateBytes?.({
        base64,
        name: templateFile.name,
        type: templateFile.type,
      });

      const schema = await inspectTemplate(
        base64,
        templateFile.name,
        templateFile.type,
      );

      setStatus("Checking image links…");

      const skus: SkuDraft[] = [];
      const failed: string[] = [];

      for (const [i, url] of links.entries()) {
        setStatus(`Checking image ${i + 1} of ${links.length}…`);

        const res = await extractFromUrl(url);

        if (!res.fetchable) {
          failed.push(url);
          continue;
        }

        const prefill = mapPrefillToSchema(res.attributes, schema);

        skus.push({
          id: `sku-${i}-${Math.random().toString(36).slice(2)}`,
          imageUrl: url,
          prefill,
          shared: { ...prefill },
          sameAsPrev: {},
          variants: [],
        });
      }

      if (failed.length) {
        setBadLinks(failed);
        setStatus("Some links could not be fetched. Replace them and continue.");
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
    <div className="grid gap-2.5 p-4">
      <div className="grid gap-1.5 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center justify-between gap-2">
          <p className="font-accent text-sm text-[#ff90e8]">
            1. Excel template
          </p>

          <span className="font-cartoon text-[9px] uppercase tracking-wide text-black/40">
            .xlsx
          </span>
        </div>

        <input
          type="file"
          accept=".xlsx"
          className={inputClass}
          onChange={(e) =>
            setTemplateFile(e.target.files?.[0] ?? null)
          }
        />
      </div>

      <div className="grid gap-1.5 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <p className="font-accent text-sm text-[#ff90e8]">
          2. Product image links
        </p>

        <LinkPillInput
          value={links}
          onChange={setLinks}
          placeholder="Paste image link(s)…"
        />

        <p className="font-cartoon text-[10px] leading-4 text-black/50">
          Each link becomes one SKU.
        </p>
      </div>

      {badLinks.length > 0 && (
        <div className="rounded-lg border-2 border-black bg-[#ffe0e0] p-2 font-cartoon text-[11px]">
          <p className="font-semibold">Could not fetch:</p>

          <ul className="mt-1 list-disc space-y-0.5 pl-4">
            {badLinks.map((link) => (
              <li key={link} className="break-all">
                {link}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        disabled={busy}
        onClick={proceed}
        className="rounded-lg border-2 border-black bg-[#ffeb3b] px-3 py-2 font-cartoon text-sm font-bold shadow-[3px_3px_0px_0px_#000] disabled:opacity-50"
      >
        {busy ? "Working…" : "Continue →"}
      </button>

      {status && (
        <p className="rounded-lg bg-white px-2.5 py-2 font-cartoon text-[11px] leading-4 text-black/70">
          {status}
        </p>
      )}
    </div>
  );
}

function Step1InputsBridge(props: {
  onReady: (
    schema: TemplateSchema,
    skus: SkuDraft[],
    meta: { base64: string; name: string; type: string },
  ) => void;
}) {
  const metaRef = useState<{
    base64: string;
    name: string;
    type: string;
  } | null>(null)[0];

  return (
    <Step1Inputs
      onReady={(schema, skus) => {
        if (metaRef) {
          props.onReady(schema, skus, metaRef);
        }
      }}
      onTemplateBytes={(meta) => {
        // The bridge is normally provided by BulkWizard.
      }}
    />
  );
}