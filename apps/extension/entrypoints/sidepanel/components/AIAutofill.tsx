import { useEffect, useState } from "react";
import { UploadCloud, Wand2, Sparkles } from "lucide-react";
import { PopButton } from "@neo/ui";
import { extractFromImage, type ExtractResult } from "../api";
import { sendFill, type FillResult } from "../fill";
import { getBusinessDetails, businessDetailsToFields, type BusinessDetails } from "../businessDetails";

const inputClass = "mt-1 w-full rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

// Map an extractor attribute key onto Meesho's field `name`. Extractor naming
// varies, so several source keys can map to the same Meesho field.
const ATTR_ALIASES: Record<string, string> = {
  color: "color",
  colour: "color",
  fabric: "fabric",
  material: "fabric",
  pattern: "pattern",
  print: "print_or_pattern_type",
  printorpatterntype: "print_or_pattern_type",
  occasion: "occasion",
  neck: "neck",
  neckline: "neck",
  sleeve: "sleeve_length",
  sleevelength: "sleeve_length",
  fit: "fit_shape",
  shape: "fit_shape",
  fitshape: "fit_shape",
  type: "generic_name",
  genericname: "generic_name",
  brand: "brand",
  length: "length",
  hemline: "hemline",
};

function toMeeshoName(key: string): string {
  const norm = key.toLowerCase().replace(/[_\s]/g, "");
  return ATTR_ALIASES[norm] ?? key.toLowerCase().replace(/\s+/g, "_");
}

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

// Production autofill: upload a product photo, the local AI infers attributes,
// you review, then Neo fills your live Meesho form (merging your saved business
// details). No demo form, no seeded catalogue.
export function AIAutofill() {
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractResult | null>(null);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  // Editable, Meesho-named attribute values (color, fabric, occasion, …).
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fillResult, setFillResult] = useState<FillResult | null>(null);

  useEffect(() => {
    getBusinessDetails().then(setBusiness);
  }, []);

  const businessEmpty =
    !!business && Object.values(businessDetailsToFields(business)).length === 0;

  async function analyze() {
    if (!imageFile) return;
    setBusy(true);
    setError(null);
    try {
      const base64 = await fileToBase64(imageFile);
      const result = await extractFromImage(base64, category || undefined);
      setExtracted(result);
      const mapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(result.attributes)) {
        if (v == null || v === "") continue;
        mapped[toMeeshoName(k)] = String(v);
      }
      setAttrs(mapped);
      if (!description) {
        const bits = [mapped.pattern, mapped.fabric, mapped.occasion ? `for ${mapped.occasion}` : ""]
          .filter(Boolean)
          .join(", ");
        if (bits) setDescription(`${productName || "This product"} — ${bits}.`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function buildFields(): Record<string, string> {
    return {
      ...(business ? businessDetailsToFields(business) : {}),
      ...attrs,
      ...(productName ? { product_name: productName } : {}),
      ...(description ? { comment: description } : {}),
    };
  }

  async function autofill() {
    setBusy(true);
    setError(null);
    try {
      const fields = buildFields();
      const r = await sendFill(
        { title: productName, description, hsnCode: "", sellingPrice: "" },
        "live",
        fields,
      );
      setFillResult(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 stroke-[3px] text-black" />
        <h2 className="font-accent text-xl tracking-wide text-black">AI Autofill</h2>
      </div>
      <p className="mt-1 font-body text-xs text-black/60">
        Open your Meesho “Add Product” page, upload the product photo here, review, then Autofill.
      </p>

      {businessEmpty && (
        <p className="mt-2 rounded-lg border-2 border-black bg-[#fff3bf] px-2 py-1.5 font-cartoon text-xs">
          Tip: fill your <strong>Business Details</strong> first so manufacturer, packer and importer
          fields autofill too.
        </p>
      )}

      <div className="mt-3 grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <label className="font-cartoon text-xs font-semibold">
          Category (optional — improves accuracy)
          <input
            className={inputClass}
            value={category}
            placeholder="e.g. Women Kurti, Men Tshirt"
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>

        <label className="font-cartoon text-xs font-semibold">
          Product photo
          <input
            className={`${inputClass} file:mr-2 file:rounded-md file:border-2 file:border-black file:bg-[#00e5ff] file:px-2 file:py-1 file:font-cartoon file:text-xs file:font-semibold`}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <button
          disabled={busy || !imageFile}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg border-2 border-black bg-[#ffeb3b] px-3 py-2 font-cartoon text-xs font-semibold shadow-[3px_3px_0px_0px_#000] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none disabled:opacity-50"
          onClick={analyze}
        >
          <UploadCloud className="h-3.5 w-3.5 stroke-[3px]" />
          {busy ? "Analyzing…" : "Analyze photo"}
        </button>

        {extracted && (
          <p className={`font-cartoon text-xs ${extracted.confidence === "low" ? "text-[#a15c00]" : "text-green-700"}`}>
            {extracted.source === "model"
              ? "AI-extracted from your photo — please review before filling."
              : "Low-confidence result — review every field carefully."}
          </p>
        )}
      </div>

      {error && <p className="mt-2 font-cartoon text-xs text-red-600">{error}</p>}

      {extracted && (
        <div className="mt-3 grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
          <label className="font-cartoon text-xs font-semibold">
            Product Name
            <input className={inputClass} value={productName} onChange={(e) => setProductName(e.target.value)} />
          </label>
          <label className="font-cartoon text-xs font-semibold">
            Description
            <textarea
              className={inputClass}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {Object.keys(attrs).length > 0 && (
            <div className="grid gap-2">
              <p className="font-cartoon text-xs font-semibold text-black/70">Detected attributes (editable):</p>
              {Object.entries(attrs).map(([key, value]) => (
                <label key={key} className="font-cartoon text-xs font-semibold">
                  {key.replace(/_/g, " ")}
                  <input
                    className={inputClass}
                    value={value}
                    onChange={(e) => setAttrs((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="mt-2">
            <PopButton
              text={busy ? "Filling…" : "Autofill Meesho"}
              color="#ff8a65"
              icon={Wand2}
              variant="panel"
              disabled={busy}
              onClick={() => {
                if (busy) return;
                autofill();
              }}
            />
          </div>
          <p className="font-cartoon text-[11px] text-black/60">
            A pink “STOP AUTOFILL” button appears on the Meesho tab so you can halt anytime. Neo never
            clicks Submit — you review and submit yourself.
          </p>

          {fillResult && (
            <p className={`mt-1 font-cartoon text-xs font-semibold ${fillResult.ok ? "text-green-700" : "text-red-600"}`}>
              {fillResult.ok
                ? `${fillResult.stopped ? "Stopped — " : ""}Filled: ${fillResult.filled?.join(", ") || "none"}.${
                    fillResult.missing?.length ? ` Not found here: ${fillResult.missing.join(", ")}.` : ""
                  }`
                : `Autofill failed: ${fillResult.error ?? "unknown error"}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
