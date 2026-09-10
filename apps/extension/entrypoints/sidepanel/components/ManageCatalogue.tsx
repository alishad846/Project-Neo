import { useState } from "react";
import { Trash2, RotateCcw, BookmarkPlus, Pencil } from "lucide-react";
import { archiveProduct, resetPrices, updateProductGenome, type getProducts } from "../api";
import { FIELD_DEFS, inputClass } from "./AddProduct";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

// Top-level genome fields the seller is most likely to need to correct
// post-save. Attribute-flagged fields still come from FIELD_DEFS below, so
// this only trims which *top-level* columns get an editable row.
const EDITABLE_TOP_LEVEL_KEYS = [
  "title",
  "category",
  "sku",
  "fabric",
  "colour",
  "sizes",
  "sellingPrice",
  "hsnCode",
  "weight",
  "costPrice",
  "brand",
];

const EDIT_FIELD_DEFS = FIELD_DEFS.filter((def) => def.attribute || EDITABLE_TOP_LEVEL_KEYS.includes(def.key));

function productFieldValue(product: Product, key: string, isAttribute?: boolean): string {
  if (isAttribute) {
    const attrs = (product.attributes as Record<string, unknown> | null) ?? {};
    const value = attrs[key];
    return value === undefined || value === null ? "" : String(value);
  }
  const value = (product as unknown as Record<string, unknown>)[key];
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function ManageCatalogueItemActions({
  product,
  onChanged,
}: {
  product: Product;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const def of EDIT_FIELD_DEFS) initial[def.key] = productFieldValue(product, def.key, def.attribute);
    return initial;
  });

  async function handleDelete() {
    setBusy(true);
    setError("");
    try {
      await archiveProduct(product.id);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    setError("");
    try {
      await resetPrices([product.sku]);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function useAsReference() {
    window.dispatchEvent(new CustomEvent("neo-set-reference-sku", { detail: { sku: product.sku } }));
  }

  function toggleEdit() {
    if (!editing) {
      const initial: Record<string, string> = {};
      for (const def of EDIT_FIELD_DEFS) initial[def.key] = productFieldValue(product, def.key, def.attribute);
      setFields(initial);
    }
    setError("");
    setEditing((prev) => !prev);
  }

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveEdit() {
    setBusy(true);
    setError("");
    try {
      const top: Record<string, unknown> = {};
      const attributes: Record<string, unknown> = {};

      for (const def of EDIT_FIELD_DEFS) {
        const raw = fields[def.key];
        if (!raw) continue;
        const value = def.type === "number" ? Number(raw) : raw;
        if (def.attribute) attributes[def.key] = value;
        else top[def.key] = value;
      }

      const body: Record<string, unknown> = {
        ...top,
        sizes: fields.sizes ? fields.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        attributes: { ...((product.attributes as Record<string, unknown> | null) ?? {}), ...attributes },
      };

      // Manually editing Selling Price redefines what "normal" price means —
      // distinct from a discount, which only changes sellingPrice.
      const priceChanged = fields.sellingPrice && fields.sellingPrice !== String(product.sellingPrice ?? "");
      if (priceChanged) body.basePrice = fields.sellingPrice;

      await updateProductGenome(product.id, body as any);
      onChanged();
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ml-auto flex shrink-0 flex-col items-end gap-1">
      <span className="flex items-center gap-1">
        {error && <span className="text-[9px] text-red-600">{error}</span>}
        <button
          type="button"
          disabled={busy}
          onClick={useAsReference}
          title="Use as AI Autofill reference"
          className="rounded-md border-2 border-black bg-[#8bd3ff] p-1 disabled:opacity-50"
        >
          <BookmarkPlus className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleReset}
          title="Reset to base price"
          className="rounded-md border-2 border-black bg-[#ffe680] p-1 disabled:opacity-50"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={toggleEdit}
          title="Edit"
          className="rounded-md border-2 border-black bg-[#c7f9cc] p-1 disabled:opacity-50"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleDelete}
          title="Delete"
          className="rounded-md border-2 border-black bg-[#ff8a8a] p-1 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </span>

      {editing && (
        <div className="mt-1 grid w-full gap-2 rounded-lg border-2 border-black bg-white p-2 shadow-[2px_2px_0px_0px_#000]">
          {EDIT_FIELD_DEFS.map((def) => (
            <label key={def.key} className="font-cartoon text-[10px] font-semibold">
              {def.label}
              <input
                className={inputClass}
                type={def.type === "number" ? "number" : "text"}
                value={fields[def.key] ?? ""}
                placeholder={def.placeholder}
                onChange={(e) => set(def.key, e.target.value)}
              />
            </label>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={handleSaveEdit}
            className="rounded-lg border-2 border-black bg-[#b2ff59] px-3 py-1.5 font-cartoon text-xs font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
