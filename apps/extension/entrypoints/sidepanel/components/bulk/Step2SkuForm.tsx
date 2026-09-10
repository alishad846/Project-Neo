// apps/extension/entrypoints/sidepanel/components/bulk/Step2SkuForm.tsx
import { deriveVariantAxes, isSharedColumn } from "./assemble";
import { VariantTable } from "./VariantTable";
import type { SkuDraft, TemplateColumn, TemplateSchema } from "./types";

const inputClass = "mt-1 w-full rounded-lg border-2 border-black px-2 py-1.5 font-cartoon text-xs";

// Measurement columns: optional per-variant size columns (bust/waist/etc.).
const MEASUREMENT_FIELDS = ["bust_size", "waist_size", "shoulder_size", "hip_size", "size_length", "length_size"];

export function Step2SkuForm(props: {
  schema: TemplateSchema;
  sku: SkuDraft;
  previous: SkuDraft | null;
  skuNumber: number;
  onChange: (next: SkuDraft) => void;
}) {
  const { schema, sku, previous, skuNumber, onChange } = props;
  const axes = deriveVariantAxes(schema);

  const sharedColumns = schema.columns.filter(
    (c) => isSharedColumn(c) && !MEASUREMENT_FIELDS.includes(c.field),
  );
  const measurementColumns = schema.columns.filter((c) => MEASUREMENT_FIELDS.includes(c.field));

  function setShared(field: string, value: string) {
    onChange({ ...sku, shared: { ...sku.shared, [field]: value } });
  }
  function toggleSame(field: string, on: boolean) {
    const shared = { ...sku.shared };
    if (on && previous) shared[field] = previous.shared[field] ?? "";
    onChange({ ...sku, sameAsPrev: { ...sku.sameAsPrev, [field]: on }, shared });
  }

  return (
    <div className="grid gap-3">
      <img src={sku.imageUrl} alt="" className="h-28 w-28 rounded-lg border-2 border-black object-cover" />

      <div className="grid gap-2 rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <p className="font-accent text-sm text-[#ff90e8]">Product details</p>
        {sharedColumns.map((c: TemplateColumn) => (
          <label key={c.field} className="font-cartoon text-xs font-semibold">
            <span className="flex items-center justify-between">
              <span>{c.header}{c.required && <span className="text-red-600"> *</span>}</span>
              {skuNumber > 1 && (
                <span className="flex items-center gap-1 text-[10px] font-normal text-black/60">
                  <input type="checkbox" checked={!!sku.sameAsPrev[c.field]} onChange={(e) => toggleSame(c.field, e.target.checked)} />
                  same as previous
                </span>
              )}
            </span>
            {c.allowedValues.length ? (
              <select className={inputClass} value={sku.shared[c.field] ?? ""} disabled={!!sku.sameAsPrev[c.field]}
                onChange={(e) => setShared(c.field, e.target.value)}>
                <option value="">Select</option>
                {c.allowedValues.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className={inputClass} value={sku.shared[c.field] ?? ""} disabled={!!sku.sameAsPrev[c.field]}
                placeholder={sku.prefill[c.field] ? `AI: ${sku.prefill[c.field]}` : c.header}
                onChange={(e) => setShared(c.field, e.target.value)} />
            )}
          </label>
        ))}
      </div>

      <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[3px_3px_0px_0px_#000]">
        <p className="font-accent text-sm text-[#ff90e8]">Variants (sizes / colours)</p>
        <VariantTable
          variants={sku.variants}
          onChange={(variants) => onChange({ ...sku, variants })}
          sizeOptions={axes.sizeOptions}
          colourOptions={axes.colourOptions}
          lengthOptions={axes.lengthOptions}
          measurementColumns={measurementColumns}
        />
      </div>
    </div>
  );
}
