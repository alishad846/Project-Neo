import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Sparkles, UploadCloud, Undo2, Wand2 } from "lucide-react";
import { PopButton } from "@neo/ui";
import {
  getProducts,
  extractAttributes,
  publishListing,
  undoPublish,
  type ExtractResult,
  type PublishResult,
} from "../api";
import { compile, validate, type MeeshoConfigId } from "@neo/adapter-meesho";
import type { ProductGenome } from "@neo/genome";
import { sendFill, type FillResult } from "../fill";

const chromeApi = (globalThis as { chrome?: any }).chrome;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const inputClass =
  "rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

export function AIComposer() {
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const [productId, setProductId] = useState<number | "">("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractResult | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [attrValues, setAttrValues] = useState<Record<string, string>>({});
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillResult, setFillResult] = useState<FillResult | null>(null);
  // Where Autofill targets: the safe local demo form, or the seller's real
  // Meesho Add-Product page. Defaults to the demo.
  const [target, setTarget] = useState<MeeshoConfigId>("fixture");

  const product = useMemo(
    () => products?.find((p) => p.id === productId) ?? null,
    [products, productId],
  );

  function selectProduct(id: number) {
    setProductId(id);
    const p = products?.find((x) => x.id === id);
    const existing = (p?.attributes ?? {}) as Record<string, unknown>;
    setTitle(p?.title ?? "");
    setDescription(typeof existing.description === "string" ? existing.description : "");
    setKeywords(Array.isArray(existing.keywords) ? (existing.keywords as string[]).join(", ") : "");
    setHsnCode(p?.hsnCode ?? "");
    setSellingPrice(p?.sellingPrice ?? "");
    setExtracted(null);
    setPublishResult(null);
    setFillResult(null);
    setAttrValues({});
  }

  async function run<T>(fn: () => Promise<T>, after: (r: T) => void) {
    setBusy(true);
    setError(null);
    try {
      after(await fn());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function analyze() {
    if (!productId || !imageFile) return;
    run(
      async () => {
        const base64 = await fileToBase64(imageFile);
        return extractAttributes(Number(productId), base64);
      },
      (r) => {
        setExtracted(r);
        setAttrValues(Object.fromEntries(Object.entries(r.attributes).map(([k, v]) => [k, String(v)])));
        if (!description) {
          const bits = [product?.fabric, r.attributes["pattern"], `for ${r.attributes["occasion"] ?? "everyday"} wear`]
            .filter(Boolean)
            .join(" ");
          setDescription(`${title || product?.title || "This product"} — ${bits}.`);
        }
      },
    );
  }

  const preview = useMemo(() => {
    if (!product) return null;
    const draft: ProductGenome = {
      ...product,
      title,
      hsnCode,
      sellingPrice,
      attributes: {
        ...((product.attributes as Record<string, unknown> | null) ?? {}),
        ...attrValues,
        description,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
      },
    };
    const listing = compile(draft, product.category ?? "uncategorised");
    return { listing, issues: validate(listing) };
  }, [product, title, description, keywords, hsnCode, sellingPrice, attrValues]);

  const errors = preview?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = preview?.issues.filter((i) => i.severity === "warning") ?? [];

  async function publish() {
    if (!productId) return;
    await run(
      () =>
        publishListing(
          Number(productId),
          title,
          {
            ...attrValues,
            description,
            keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          },
          { hsnCode, sellingPrice },
        ),
      async (r) => {
        setPublishResult(r);
        setFillResult(null);
        if (chromeApi?.tabs) {
          await chromeApi.tabs.create({ url: chromeApi.runtime.getURL("meesho-fixture/index.html") });
        }
        queryClient.invalidateQueries({ queryKey: ["products"] });
      },
    );
  }

  async function undo() {
    if (!publishResult) return;
    await run(
      () => undoPublish(publishResult.txnId),
      () => {
        setPublishResult(null);
        setFillResult(null);
        queryClient.invalidateQueries({ queryKey: ["products"] });
      },
    );
  }

  async function autofill() {
    if (!preview) return;
    await run(
      () =>
        sendFill(
          {
            title: preview.listing.fields.title as string,
            description: preview.listing.fields.description as string,
            hsnCode: preview.listing.fields.hsnCode as string,
            sellingPrice: preview.listing.fields.sellingPrice as string,
          },
          target,
        ),
      (r) => setFillResult(r),
    );
  }

  function openDemoForm() {
    chromeApi?.tabs?.create?.({ url: "http://localhost:4173/demo" });
  }

  return (
    <div className="p-4">
      <h2 className="font-accent text-xl tracking-wide text-black">AI Composer</h2>

      <div className="mt-3 grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <select
          className={inputClass}
          value={productId}
          onChange={(e) => selectProduct(Number(e.target.value))}
        >
          <option value="">Select a product…</option>
          {products?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.title}
            </option>
          ))}
        </select>

        <input
          className={`${inputClass} file:mr-2 file:rounded-md file:border-2 file:border-black file:bg-[#00e5ff] file:px-2 file:py-1 file:font-cartoon file:text-xs file:font-semibold`}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />

        <button
          disabled={busy || !productId || !imageFile}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#ffeb3b] px-3 py-2 font-cartoon text-xs font-semibold shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50"
          onClick={analyze}
        >
          <UploadCloud className="h-3.5 w-3.5 stroke-[3px]" />
          Analyze photo
        </button>

        {extracted && (
          <p className={`font-cartoon text-xs ${extracted.confidence === "low" ? "text-[#a15c00]" : "text-green-700"}`}>
            {extracted.confidence === "low"
              ? "Low-confidence heuristic result — please review every field before publishing."
              : "Model-extracted result."}
          </p>
        )}
      </div>

      {error && <p className="mt-2 font-cartoon text-xs text-red-600">{error}</p>}

      {product && (
        <div className="mt-3 grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
          <label className="font-cartoon text-xs font-semibold">
            Title
            <input className={`${inputClass} mt-1 w-full`} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="font-cartoon text-xs font-semibold">
            Description
            <textarea
              className={`${inputClass} mt-1 w-full`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="font-cartoon text-xs font-semibold">
            Keywords (comma-separated)
            <input className={`${inputClass} mt-1 w-full`} value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </label>
          <label className="font-cartoon text-xs font-semibold">
            HSN code
            <input className={`${inputClass} mt-1 w-full`} value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
          </label>
          <label className="font-cartoon text-xs font-semibold">
            Selling price
            <input className={`${inputClass} mt-1 w-full`} value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} />
          </label>

          {Object.keys(attrValues).length > 0 && (
            <div className="grid gap-2">
              {Object.entries(attrValues).map(([key, value]) => (
                <label key={key} className="font-cartoon text-xs font-semibold">
                  {key}
                  <input
                    className={`${inputClass} mt-1 w-full`}
                    value={value}
                    onChange={(e) => setAttrValues((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <ul className="list-disc pl-4 font-cartoon text-xs text-red-600">
              {errors.map((i) => (
                <li key={i.field}>{i.message}</li>
              ))}
            </ul>
          )}
          {warnings.length > 0 && (
            <ul className="list-disc pl-4 font-cartoon text-xs text-[#a15c00]">
              {warnings.map((i) => (
                <li key={i.field}>{i.message}</li>
              ))}
            </ul>
          )}

          {publishResult == null ? (
            <div className="mt-2">
              <PopButton
                text="Publish"
                color="#b2ff59"
                icon={Sparkles}
                variant="panel"
                disabled={busy || errors.length > 0}
                onClick={() => { if (busy || errors.length > 0) return; publish(); }}
              />
            </div>
          ) : (
            <div className="mt-2">
              <p className="font-cartoon text-xs font-semibold text-green-700">
                Published as transaction #{publishResult.txnId}.
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <PopButton
                  text="Open demo form"
                  color="#fff59d"
                  icon={ExternalLink}
                  variant="panel"
                  onClick={openDemoForm}
                />
              </div>
              <p className="mt-1 font-cartoon text-[11px] text-black/60">
                Open your Meesho Add-Product page, or the Neo demo form above, in a tab — then pick a
                target and click Autofill. A pink “STOP AUTOFILL” button lets you halt anytime.
              </p>

              <label className="mt-2 flex items-center gap-2 font-cartoon text-xs font-semibold">
                Fill into:
                <select
                  className={inputClass}
                  value={target}
                  onChange={(e) => setTarget(e.target.value as MeeshoConfigId)}
                >
                  <option value="fixture">Neo demo form</option>
                  <option value="live">My Meesho (Add Product)</option>
                </select>
              </label>

              <div className="mt-2 flex flex-wrap gap-2">
                <PopButton
                  text="Autofill Meesho"
                  color="#ff8a65"
                  icon={Wand2}
                  variant="panel"
                  disabled={busy}
                  onClick={() => { if (busy) return; autofill(); }}
                />
                <PopButton
                  text="Previous"
                  color="#00e5ff"
                  icon={Undo2}
                  variant="panel"
                  disabled={busy}
                  onClick={() => { if (busy) return; undo(); }}
                />
              </div>
              {fillResult && (
                <p className={`mt-2 font-cartoon text-xs font-semibold ${fillResult.ok ? "text-green-700" : "text-red-600"}`}>
                  {fillResult.ok
                    ? `${fillResult.stopped ? "Stopped — " : ""}Filled: ${fillResult.filled?.join(", ") || "none"}.${
                        fillResult.missing?.length ? ` Missing: ${fillResult.missing.join(", ")}.` : ""
                      }${
                        fillResult.skipped?.length ? ` Not on this step: ${fillResult.skipped.join(", ")}.` : ""
                      }`
                    : `Autofill failed: ${fillResult.error ?? "unknown error"}`}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
