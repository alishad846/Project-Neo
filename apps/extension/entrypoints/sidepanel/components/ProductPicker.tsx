import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../api";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

export interface ProductPickerProps {
  selected: string[];
  onSelectedChange: (skus: string[]) => void;
  renderItemExtra?: (product: Product) => React.ReactNode;
}

// Any product where sellingPrice is below its recorded basePrice is
// currently discounted — the badge lets a seller pick those out at a
// glance and select them for a bulk "Reset to base price."
function discountBadge(product: Product): string | null {
  const base = product.basePrice != null ? Number(product.basePrice) : null;
  const selling = product.sellingPrice != null ? Number(product.sellingPrice) : null;
  if (base == null || selling == null || !(selling < base)) return null;
  const pct = Math.round((1 - selling / base) * 100);
  return `${pct}% off from ₹${base}`;
}

export function ProductPicker({ selected, onSelectedChange, renderItemExtra }: ProductPickerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((e) => setError((e as Error).message));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => Boolean(c)))),
    [products],
  );

  const visible = useMemo(
    () => (categoryFilter ? products.filter((p) => p.category === categoryFilter) : products),
    [products, categoryFilter],
  );

  function toggle(sku: string, checked: boolean) {
    if (checked) {
      if (!selected.includes(sku)) onSelectedChange([...selected, sku]);
    } else {
      onSelectedChange(selected.filter((s) => s !== sku));
    }
  }

  if (error) return <p className="font-cartoon text-xs text-red-600">{error}</p>;

  return (
    <div>
      {categories.length > 0 && (
        <select
          className="mb-2 w-full rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {visible.length === 0 ? (
        <p className="font-cartoon text-xs text-gray-600">No products yet.</p>
      ) : (
        <div className="grid gap-2 max-h-80 overflow-y-auto">
          {visible.map((product) => {
            const badge = discountBadge(product);
            return (
              <label
                key={product.id}
                className="flex items-center gap-2 rounded-lg border-2 border-black bg-white p-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(product.sku)}
                  onChange={(e) => toggle(product.sku, e.target.checked)}
                />
                <span className="flex-1 font-cartoon text-xs">
                  <strong>{product.sku}</strong> — {product.title || "Untitled"}
                  {badge && (
                    <span className="ml-2 rounded-full border border-black bg-[#ffe680] px-1.5 py-0.5 text-[10px] font-bold">
                      {badge}
                    </span>
                  )}
                </span>
                {renderItemExtra?.(product)}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
