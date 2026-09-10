// apps/extension/entrypoints/sidepanel/components/bulk/VariantTable.tsx
import { Plus, Trash2 } from "lucide-react";
import { newVariantRow } from "./assemble";
import type { TemplateColumn, VariantRow } from "./types";

const cell =
  "w-full rounded border-2 border-black px-1.5 py-1 font-cartoon text-[11px]";

function Select(props: {
  value: string; options: string[]; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <select className={cell} value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      <option value="">{props.placeholder}</option>
      {props.options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function VariantTable(props: {
  variants: VariantRow[];
  onChange: (next: VariantRow[]) => void;
  sizeOptions: string[];
  colourOptions: string[];
  lengthOptions: string[];
  measurementColumns: TemplateColumn[];
}) {
  const { variants, onChange } = props;

  function patch(id: string, patchObj: Partial<VariantRow>) {
    onChange(variants.map((v) => (v.id === id ? { ...v, ...patchObj } : v)));
  }
  function patchMeasure(id: string, field: string, value: string) {
    onChange(variants.map((v) =>
      v.id === id ? { ...v, measurements: { ...v.measurements, [field]: value } } : v));
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="text-left font-cartoon">
            <th className="pr-1">Size</th>
            {props.colourOptions.length > 0 && <th className="pr-1">Colour</th>}
            {props.lengthOptions.length > 0 && <th className="pr-1">Length</th>}
            <th className="pr-1">Price</th>
            <th className="pr-1">MRP</th>
            <th className="pr-1">Inv</th>
            <th className="pr-1">W/D Return</th>
            {props.measurementColumns.map((c) => <th key={c.field} className="pr-1">{c.header}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => (
            <tr key={v.id}>
              <td className="pr-1">
                {props.sizeOptions.length
                  ? <Select value={v.variation} options={props.sizeOptions} placeholder="Size" onChange={(x) => patch(v.id, { variation: x })} />
                  : <input className={cell} value={v.variation} placeholder="Size" onChange={(e) => patch(v.id, { variation: e.target.value })} />}
              </td>
              {props.colourOptions.length > 0 && (
                <td className="pr-1"><Select value={v.color} options={props.colourOptions} placeholder="Colour" onChange={(x) => patch(v.id, { color: x })} /></td>
              )}
              {props.lengthOptions.length > 0 && (
                <td className="pr-1"><Select value={v.length} options={props.lengthOptions} placeholder="Length" onChange={(x) => patch(v.id, { length: x })} /></td>
              )}
              <td className="pr-1"><input className={cell} inputMode="numeric" value={v.meesho_price} onChange={(e) => patch(v.id, { meesho_price: e.target.value })} /></td>
              <td className="pr-1"><input className={cell} inputMode="numeric" value={v.mrp} onChange={(e) => patch(v.id, { mrp: e.target.value })} /></td>
              <td className="pr-1"><input className={cell} inputMode="numeric" value={v.inventory} onChange={(e) => patch(v.id, { inventory: e.target.value })} /></td>
              <td className="pr-1"><input className={cell} inputMode="numeric" value={v.wrong_defective_returns_price} onChange={(e) => patch(v.id, { wrong_defective_returns_price: e.target.value })} /></td>
              {props.measurementColumns.map((c) => (
                <td key={c.field} className="pr-1"><input className={cell} value={v.measurements[c.field] ?? ""} onChange={(e) => patchMeasure(v.id, c.field, e.target.value)} /></td>
              ))}
              <td>
                <button type="button" onClick={() => onChange(variants.filter((x) => x.id !== v.id))}
                  className="rounded border-2 border-black p-1"><Trash2 className="h-3 w-3" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={() => onChange([...variants, newVariantRow()])}
        className="mt-2 flex items-center gap-1 rounded-lg border-2 border-black bg-[#b2ff59] px-2 py-1 font-cartoon text-xs font-semibold">
        <Plus className="h-3 w-3 stroke-[3px]" /> Add variant
      </button>
    </div>
  );
}
