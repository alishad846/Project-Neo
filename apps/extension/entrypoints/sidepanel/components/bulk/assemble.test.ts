import { describe, it, expect } from "vitest";
import {
  assembleProduct,
  applySameAsPrevious,
  optionalGroupStatus,
  deriveVariantAxes,
  mapPrefillToSchema,
} from "./assemble";
import type { SkuDraft, TemplateColumn, TemplateSchema, VariantRow } from "./types";

function variant(over: Partial<VariantRow> = {}): VariantRow {
  return {
    id: "v1", variation: "M", color: "Red", length: "",
    meesho_price: "499", mrp: "999", inventory: "10",
    wrong_defective_returns_price: "300", measurements: {}, ...over,
  };
}
function sku(over: Partial<SkuDraft> = {}): SkuDraft {
  return {
    id: "s1", imageUrl: "https://cdn/x.png", prefill: {},
    shared: { product_name: "Kurti", fabric: "Cotton", hsn_code: "6204" },
    sameAsPrev: {}, variants: [variant()], ...over,
  };
}

describe("assembleProduct", () => {
  it("assigns a group_id and repeats the image across variants", () => {
    const out = assembleProduct(sku({ variants: [variant({ id: "a", variation: "S" }), variant({ id: "b", variation: "L" })] }), 0);
    expect(out.group_id).toBe("PN-G1");
    expect(out.images).toEqual(["https://cdn/x.png"]);
    expect(out.variants).toHaveLength(2);
  });

  it("keeps an explicit shared group_id when provided", () => {
    const out = assembleProduct(sku({ shared: { group_id: "MYG" } }), 3);
    expect(out.group_id).toBe("MYG");
  });

  it("puts shared fields at top level AND in attributes", () => {
    const out = assembleProduct(sku(), 0);
    expect(out.product_name).toBe("Kurti");
    expect(out.attributes.fabric).toBe("Cotton");
    expect(out.attributes.hsn_code).toBe("6204");
  });

  it("carries per-variant price/mrp/inventory and measurements", () => {
    const out = assembleProduct(
      sku({ variants: [variant({ meesho_price: "550", measurements: { bust_size: "38" } })] }),
      0,
    );
    expect(out.variants[0].meesho_price).toBe("550");
    expect(out.variants[0].bust_size).toBe("38");
  });
});

describe("applySameAsPrevious", () => {
  const prev = sku({ shared: { product_name: "Prev", fabric: "Silk" } });
  it("copies only toggled-on fields from the previous sku", () => {
    const cur = sku({ shared: { product_name: "Cur", fabric: "" }, sameAsPrev: { fabric: true } });
    const out = applySameAsPrevious(cur, prev);
    expect(out.shared.fabric).toBe("Silk");     // copied
    expect(out.shared.product_name).toBe("Cur"); // untouched
  });
  it("is a no-op when previous is null", () => {
    const cur = sku({ sameAsPrev: { fabric: true } });
    expect(applySameAsPrevious(cur, null)).toEqual(cur);
  });
});

describe("optionalGroupStatus", () => {
  const cols: TemplateColumn[] = [
    { index: 0, column: "A", header: "Bust", field: "bust_size", type: "optional", required: false, system: false, recommended: false, optional: true, allowedValues: [] },
    { index: 1, column: "B", header: "Waist", field: "waist_size", type: "optional", required: false, system: false, recommended: false, optional: true, allowedValues: [] },
  ];
  it("empty when none filled", () => {
    expect(optionalGroupStatus({}, cols)).toBe("empty");
  });
  it("complete when all filled", () => {
    expect(optionalGroupStatus({ bust_size: "38", waist_size: "30" }, cols)).toBe("complete");
  });
  it("partial when some filled", () => {
    expect(optionalGroupStatus({ bust_size: "38" }, cols)).toBe("partial");
  });
});

describe("deriveVariantAxes", () => {
  const schema: TemplateSchema = {
    version: "x", fillSheet: "f", validationSheet: "v", dataStartRow: 5,
    columns: [
      { index: 0, column: "A", header: "Size", field: "variation", type: "required", required: true, system: false, recommended: false, optional: false, allowedValues: ["S", "M", "L"] },
      { index: 1, column: "B", header: "Color", field: "color", type: "optional", required: false, system: false, recommended: false, optional: true, allowedValues: ["Red", "Blue"] },
    ],
  };
  it("pulls size and colour options from matching columns", () => {
    const axes = deriveVariantAxes(schema);
    expect(axes.sizeOptions).toEqual(["S", "M", "L"]);
    expect(axes.colourOptions).toEqual(["Red", "Blue"]);
    expect(axes.lengthOptions).toEqual([]);
  });
});

describe("mapPrefillToSchema", () => {
  const schema: TemplateSchema = {
    version: "x", fillSheet: "f", validationSheet: "v", dataStartRow: 5,
    columns: [
      { index: 0, column: "A", header: "Color", field: "color", type: "optional", required: false, system: false, recommended: false, optional: true, allowedValues: [] },
      { index: 1, column: "B", header: "Neck", field: "neck", type: "optional", required: false, system: false, recommended: false, optional: true, allowedValues: [] },
      { index: 2, column: "C", header: "Sleeve Length", field: "sleeve_length", type: "optional", required: false, system: false, recommended: false, optional: true, allowedValues: [] },
      { index: 3, column: "D", header: "Print or Pattern Type", field: "print_or_pattern_type", type: "optional", required: false, system: false, recommended: false, optional: true, allowedValues: [] },
    ],
  };

  it("maps model attribute keys onto the template's actual field names via synonyms", () => {
    const out = mapPrefillToSchema(
      { color: "Dark Green", neckType: "Round Neck", sleeveLength: "Half Sleeve", pattern: "Solid" },
      schema,
    );
    expect(out).toEqual({
      color: "Dark Green",
      neck: "Round Neck",
      sleeve_length: "Half Sleeve",
      print_or_pattern_type: "Solid",
    });
  });

  it("drops extracted attributes with no matching template column", () => {
    const out = mapPrefillToSchema({ blousePiece: "true", occasion: "Casual" }, schema);
    expect(out).toEqual({}); // neither blousePiece nor occasion exists in this schema
  });

  it("ignores null/empty values", () => {
    const out = mapPrefillToSchema({ color: "", neckType: null as unknown as string }, schema);
    expect(out).toEqual({});
  });
});
