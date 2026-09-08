import { useState } from "react";
import { Trash2, RotateCcw, BookmarkPlus } from "lucide-react";
import { archiveProduct, resetPrices, type getProducts } from "../api";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

export function ManageCatalogueItemActions({
  product,
  onChanged,
}: {
  product: Product;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <span className="ml-auto flex shrink-0 items-center gap-1">
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
        onClick={handleDelete}
        title="Delete"
        className="rounded-md border-2 border-black bg-[#ff8a8a] p-1 disabled:opacity-50"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </span>
  );
}
