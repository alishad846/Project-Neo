import { useState } from "react";
import { UploadCloud, Save } from "lucide-react";
import { PopButton } from "@neo/ui";
import { createProduct, scrapeMeeshoListing, uploadProductImage } from "../api";

export const inputClass = "mt-1 w-full rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  attribute?: boolean; // true => nested under `attributes`, false => top-level genome column
  type?: "text" | "number";
}

// Sourced from apps/extension/lib/meesho/meesho-mappings.js's MEESHO_FIELD_MAPPINGS
// (the intern's real Meesho field list) plus Neo's own cost-price tracking.
// Manufacturer/Packer/Importer are deliberately excluded — those are
// seller-level Business Details, not re-entered per product. Wrong/Defective
// Returns Price and Group ID are excluded too (derived/system-generated).
export const FIELD_DEFS: FieldDef[] = [
  { key: "title", label: "Product Name", placeholder: "e.g. Printed Cotton Kurti", required: true },
  { key: "category", label: "Category", placeholder: "e.g. Women > Kurtis", required: true },
  { key: "sku", label: "SKU", placeholder: "e.g. KURTI-001", required: true },
  { key: "fabric", label: "Fabric", placeholder: "e.g. Cotton", required: true },
  { key: "colour", label: "Colour", placeholder: "e.g. Indigo Blue", required: true },
  { key: "sizes", label: "Sizes / Variation", placeholder: "e.g. S, M, L, XL", required: true },
  { key: "sellingPrice", label: "Meesho Price", placeholder: "e.g. 699", required: true, type: "number" },
  { key: "mrp", label: "MRP", placeholder: "e.g. 999", required: true, type: "number", attribute: true },
  { key: "gstPercent", label: "GST %", placeholder: "e.g. 5", required: true, type: "number", attribute: true },
  { key: "hsnCode", label: "HSN ID", placeholder: "e.g. 6204", required: true },
  { key: "weight", label: "Net Weight (gms)", placeholder: "e.g. 300", required: true, type: "number" },
  { key: "inventory", label: "Inventory", placeholder: "e.g. 50", required: true, type: "number", attribute: true },
  { key: "costPrice", label: "Cost Price", placeholder: "e.g. 250", type: "number" },
  { key: "brand", label: "Brand", placeholder: "e.g. NeoDemo" },
  { key: "styleCode", label: "Style / Product ID", placeholder: "e.g. STY-1042", attribute: true },
  { key: "description", label: "Description", placeholder: "e.g. Breathable pure-cotton kurti for daily wear", attribute: true },
  { key: "countryOfOrigin", label: "Country of Origin", placeholder: "e.g. India", attribute: true },
  { key: "pattern", label: "Pattern", placeholder: "e.g. Printed", attribute: true },
  { key: "printPatternType", label: "Print or Pattern Type", placeholder: "e.g. Floral Print", attribute: true },
  { key: "surfaceStyling", label: "Surface Styling", placeholder: "e.g. Embroidered", attribute: true },
  { key: "occasion", label: "Occasion", placeholder: "e.g. Festive", attribute: true },
  { key: "neckType", label: "Neck Type", placeholder: "e.g. Round Neck", attribute: true },
  { key: "sleeveLength", label: "Sleeve Length", placeholder: "e.g. Three-Quarter", attribute: true },
  { key: "sareeLength", label: "Saree Length", placeholder: "e.g. 6.3 metres", attribute: true },
  { key: "notes", label: "Notes", placeholder: "e.g. Packaging or handling notes", attribute: true },
];

const REQUIRED_KEYS = FIELD_DEFS.filter((f) => f.required).map((f) => f.key);

// Maps Meesho's field identifiers (from meesho-mappings.js's `our_key` column)
// to this form's FIELD_DEFS keys, for the "Import from open Meesho tab" button.
const SCRAPE_FIELD_MAP: Record<string, string> = {
  product_name: "title",
  hsn_id: "hsnCode",
  hsn_code: "hsnCode",
  net_weight_gms: "weight",
  brand_name: "brand",
  brand: "brand",
  style_code: "styleCode",
  supplier_product_id: "styleCode",
  description: "description",
  comment: "description",
  country_of_origin: "countryOfOrigin",
  pattern: "pattern",
  print_pattern_type: "printPatternType",
  print_or_pattern_type: "printPatternType",
  surface_styling: "surfaceStyling",
  fabric: "fabric",
  material: "fabric",
  color: "colour",
  colour: "colour",
  occasion: "occasion",
  neck: "neckType",
  sleeve_length: "sleeveLength",
  meesho_price: "sellingPrice",
};

export function AddProduct() {
  const [fields, setFields] = useState<Record<string, string>>({ countryOfOrigin: "India" });
  const [blousePiece, setBlousePiece] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function importFromMeesho() {
    setImporting(true);
    setError("");
    try {
      const scraped = await scrapeMeeshoListing();
      setFields((prev) => {
        const next = { ...prev };
        for (const [meeshoKey, formKey] of Object.entries(SCRAPE_FIELD_MAP)) {
          if (scraped[meeshoKey]) next[formKey] = scraped[meeshoKey];
        }
        return next;
      });
      setMessage("Imported from the open Meesho tab — review before saving.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  async function handleImageFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const { url } = await uploadProductImage(base64, file.name);
        setImageUrls((prev) => [...prev, url]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1] ?? (reader.result as string));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function missingRequired(): string[] {
    return REQUIRED_KEYS.filter((k) => !fields[k]?.trim()).concat(imageUrls.length === 0 ? ["images"] : []);
  }

  async function handleSave() {
    const missing = missingRequired();
    if (missing.length > 0) {
      setError(`Missing required fields: ${missing.join(", ")}`);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const top: Record<string, unknown> = {};
      const attributes: Record<string, unknown> = {};

      for (const def of FIELD_DEFS) {
        const raw = fields[def.key];
        if (!raw) continue;
        const value = def.type === "number" ? Number(raw) : raw;
        if (def.attribute) attributes[def.key] = value;
        else top[def.key] = value;
      }

      if (blousePiece) attributes.blousePiece = true;

      await createProduct({
        ...top,
        sizes: fields.sizes ? fields.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        images: imageUrls,
        attributes,
      } as any);

      setMessage("Product saved to your catalogue.");
      setFields({ countryOfOrigin: "India" });
      setImageUrls([]);
      setBlousePiece(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="font-accent text-xl tracking-wide text-black">Add Product</h2>
      <p className="mt-1 font-body text-xs text-black/60">
        Save a past product's full details into your Neo catalogue — it becomes AI-extraction reference context for
        future products in the same category, and shows up in Manage Catalogue, Bulk Catalogue, and Add Discount.
      </p>

      <div className="mt-3 grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <button
          type="button"
          disabled={importing}
          onClick={importFromMeesho}
          className="rounded-lg border-2 border-black bg-[#a06bff] px-3 py-2 font-cartoon text-xs font-semibold text-white disabled:opacity-50"
        >
          {importing ? "Importing…" : "Import from open Meesho tab"}
        </button>

        {FIELD_DEFS.map((def) => (
          <label key={def.key} className="font-cartoon text-xs font-semibold">
            {def.label}
            {def.required ? " *" : ""}
            <input
              className={inputClass}
              type={def.type === "number" ? "number" : "text"}
              value={fields[def.key] ?? ""}
              placeholder={def.placeholder}
              onChange={(e) => set(def.key, e.target.value)}
            />
          </label>
        ))}

        <label className="flex items-center gap-2 font-cartoon text-xs font-semibold">
          <input type="checkbox" checked={blousePiece} onChange={(e) => setBlousePiece(e.target.checked)} />
          Blouse Piece Included
        </label>

        <label className="font-cartoon text-xs font-semibold">
          Product Images *
          <input
            className={`${inputClass} file:mr-2 file:rounded-md file:border-2 file:border-black file:bg-[#00e5ff] file:px-2 file:py-1 file:font-cartoon file:text-xs file:font-semibold`}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleImageFiles(e.target.files)}
          />
        </label>
        {uploading && <p className="font-cartoon text-xs text-black/60">Uploading…</p>}
        {imageUrls.length > 0 && (
          <p className="font-cartoon text-xs text-green-700">{imageUrls.length} image(s) uploaded.</p>
        )}

        {error && <p className="font-cartoon text-xs text-red-600">{error}</p>}
        {message && <p className="font-cartoon text-xs text-green-700">{message}</p>}

        <div className="mt-1">
          <PopButton
            text={saving ? "Saving…" : "Save Product"}
            color="#b2ff59"
            icon={saving ? UploadCloud : Save}
            onClick={() => {
              if (saving) return;
              handleSave();
            }}
          />
        </div>
      </div>
    </div>
  );
}
