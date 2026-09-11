// apps/extension/entrypoints/sidepanel/components/bulk/VariantTable.tsx
import { Fragment } from "react";
import { Plus, Trash2 } from "lucide-react";
import { newVariantRow } from "./assemble";
import { LinkPillInput } from "./LinkPillInput";
import type { TemplateColumn, VariantRow } from "./types";

const cell =
  "w-full rounded border-2 border-black px-1.5 py-1 font-cartoon text-[11px]";
const cellError =
  "w-full rounded border-2 border-red-600 bg-red-50 px-1.5 py-1 font-cartoon text-[11px]";

// A red asterisk marking a required column header.
function Req() {
  return <span className="text-red-600"> *</span>;
}

// Returns the price-hierarchy problem for a row, or null. Meesho requires
// Returns Price < Meesho Price < MRP.
function priceIssue(v: {
  meesho_price: string; mrp: string; wrong_defective_returns_price: string;
}): { price?: boolean; mrp?: boolean; wdr?: boolean; message: string } | null {
  const price = Number(v.meesho_price);
  const mrp = Number(v.mrp);
  const wdr = Number(v.wrong_defective_returns_price);
  const hasPrice = v.meesho_price !== "" && Number.isFinite(price);
  const hasMrp = v.mrp !== "" && Number.isFinite(mrp);
  const hasWdr = v.wrong_defective_returns_price !== "" && Number.isFinite(wdr);

  if (hasPrice && hasMrp && !(price < mrp)) {
    return { price: true, mrp: true, message: `Price (₹${price}) must be less than MRP (₹${mrp}).` };
  }
  if (hasWdr && hasPrice && hasMrp && !(wdr < price && price < mrp)) {
    return { wdr: true, message: `Returns price must be lowest: ₹${wdr} < ₹${price} < ₹${mrp}.` };
  }
  return null;
}

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
  // The SKU's pasted link — used as the front-image fallback/hint per variant.
  skuImageUrl?: string;
}) {
  const { variants, onChange } = props;

  function imageLabel(i: number): string {
    return i === 0 ? "Front" : `Img ${i + 1}`;
  }

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
            <th className="pr-1">Size<Req /></th>
            {props.colourOptions.length > 0 && <th className="pr-1">Colour</th>}
            {props.lengthOptions.length > 0 && <th className="pr-1">Length</th>}
            <th className="pr-1">Price<Req /></th>
            <th className="pr-1">MRP<Req /></th>
            <th className="pr-1">Inv<Req /></th>
            <th
              className="pr-1"
              title="Wrong/Defective Returns Price — what Meesho credits you when a buyer returns a wrong or defective item. Must be the lowest: Returns < Price < MRP."
            >
              W/D Return<Req /> ⓘ
            </th>
            {props.measurementColumns.map((c) => <th key={c.field} className="pr-1">{c.header}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => {
            const issue = priceIssue(v);
            const colSpan = 5 + (props.colourOptions.length > 0 ? 1 : 0) +
              (props.lengthOptions.length > 0 ? 1 : 0) + props.measurementColumns.length + 1;
            return (
            <Fragment key={v.id}>
            <tr>
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
              <td className="pr-1"><input className={issue?.price ? cellError : cell} inputMode="numeric" value={v.meesho_price} onChange={(e) => patch(v.id, { meesho_price: e.target.value })} /></td>
              <td className="pr-1"><input className={issue?.mrp ? cellError : cell} inputMode="numeric" value={v.mrp} onChange={(e) => patch(v.id, { mrp: e.target.value })} /></td>
              <td className="pr-1"><input className={cell} inputMode="numeric" value={v.inventory} onChange={(e) => patch(v.id, { inventory: e.target.value })} /></td>
              <td className="pr-1"><input className={issue?.wdr ? cellError : cell} inputMode="numeric" value={v.wrong_defective_returns_price} onChange={(e) => patch(v.id, { wrong_defective_returns_price: e.target.value })} /></td>
              {props.measurementColumns.map((c) => (
                <td key={c.field} className="pr-1"><input className={cell} value={v.measurements[c.field] ?? ""} onChange={(e) => patchMeasure(v.id, c.field, e.target.value)} /></td>
              ))}
              <td>
                <button type="button" onClick={() => onChange(variants.filter((x) => x.id !== v.id))}
                  className="rounded border-2 border-black p-1"><Trash2 className="h-3 w-3" /></button>
              </td>
            </tr>
            <tr>
              <td colSpan={colSpan} className="pb-2 pl-1">
                <div className="flex items-start gap-2">
                  <span className="mt-1 shrink-0 font-cartoon text-[10px] font-semibold text-black/70">
                    Images (Front<span className="text-red-600">*</span>, then optional 2–4):
                  </span>
                  <div className="flex-1">
                    <LinkPillInput
                      value={v.images ?? []}
                      onChange={(imgs) => patch(v.id, { images: imgs })}
                      max={4}
                      labelFor={(i) => imageLabel(i)}
                      placeholder={
                        props.skuImageUrl
                          ? "Front image defaults to the SKU link — paste to override / add more…"
                          : "Paste the front image link…"
                      }
                    />
                  </div>
                </div>
              </td>
            </tr>
            {issue && (
              <tr>
                <td colSpan={colSpan} className="pb-1 pl-1 font-cartoon text-[10px] text-red-600">
                  {issue.message}
                </td>
              </tr>
            )}
            </Fragment>
          );})}
        </tbody>
      </table>
      <button type="button" onClick={() => onChange([...variants, newVariantRow()])}
        className="mt-2 flex items-center gap-1 rounded-lg border-2 border-black bg-[#b2ff59] px-2 py-1 font-cartoon text-xs font-semibold">
        <Plus className="h-3 w-3 stroke-[3px]" /> Add variant
      </button>
    </div>
  );
}
