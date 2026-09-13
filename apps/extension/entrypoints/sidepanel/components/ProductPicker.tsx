import { useEffect, useMemo, useState } from "react";
import { getProducts } from "../api";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

export interface ProductPickerProps {
  selected: string[];
  onSelectedChange: (skus: string[]) => void;
  renderItemExtra?: (product: Product) => React.ReactNode;
}

function discountBadge(product: Product): string | null {
  const base = product.basePrice != null ? Number(product.basePrice) : null;
  const selling = product.sellingPrice != null ? Number(product.sellingPrice) : null;

  if (base == null || selling == null || !(selling < base)) return null;

  const pct = Math.round((1 - selling / base) * 100);
  return `${pct}% off · ₹${base}`;
}

export function ProductPicker({
  selected,
  onSelectedChange,
  renderItemExtra,
}: ProductPickerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((e) => setError((e as Error).message));
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products
            .map((p) => p.category)
            .filter((c): c is string => Boolean(c)),
        ),
      ),
    [products],
  );

  const visible = useMemo(
    () =>
      categoryFilter
        ? products.filter((p) => p.category === categoryFilter)
        : products,
    [products, categoryFilter],
  );

  function toggle(sku: string, checked: boolean) {
    if (checked) {
      if (!selected.includes(sku)) {
        onSelectedChange([...selected, sku]);
      }
    } else {
      onSelectedChange(selected.filter((s) => s !== sku));
    }
  }

  if (error) {
    return (
      <p className="font-cartoon text-xs leading-5 text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div>
      {categories.length > 0 && (
        <select
          aria-label="Filter by category"
          className="mb-2 w-full rounded-lg border-2 border-black bg-white px-2 py-1.5 font-cartoon text-[11px] leading-5"
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
        <div className="rounded-lg border-2 border-dashed border-black/30 bg-white/60 px-3 py-4 text-center">
          <p className="font-cartoon text-xs font-semibold text-black/60">
            No products yet
          </p>
        </div>
      ) : (
        <div className="grid max-h-80 gap-1.5 overflow-y-auto pr-0.5">
          {visible.map((product) => {
            const badge = discountBadge(product);
            const isSelected = selected.includes(product.sku);

            return (
              <label
                key={product.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 border-black p-2 transition-all ${
                  isSelected
                    ? "bg-[#fff3a6] shadow-[2px_2px_0px_0px_#000]"
                    : "bg-white hover:-translate-y-0.5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => toggle(product.sku, e.target.checked)}
                  className="shrink-0"
                />

                <span className="min-w-0 flex-1 font-cartoon text-[11px] leading-4">
                  <strong>{product.sku}</strong>
                  <span className="text-black/70">
                    {" "}
                    · {product.title || "Untitled"}
                  </span>

                  {badge && (
                    <span className="ml-1.5 inline-block rounded-full border border-black bg-[#ffe680] px-1.5 py-0.5 text-[9px] font-bold leading-none">
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