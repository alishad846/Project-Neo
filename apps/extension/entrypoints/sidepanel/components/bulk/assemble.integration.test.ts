// apps/extension/entrypoints/sidepanel/components/bulk/assemble.integration.test.ts
import { describe, it, expect } from "vitest";
import { assembleProduct } from "./assemble";
import type { SkuDraft } from "./types";

function sku(over: Partial<SkuDraft>): SkuDraft {
  return {
    id: "s", imageUrl: "https://cdn/x.png", prefill: {},
    shared: { product_name: "Kurti" }, sameAsPrev: {}, variants: [], ...over,
  } as SkuDraft;
}

describe("assembled shape for the engine", () => {
  it("two SKUs get distinct group ids and each variant inherits the SKU image", () => {
    const a = assembleProduct(sku({
      imageUrl: "https://cdn/a.png",
      variants: [
        { id: "1", variation: "S", color: "Red", length: "", meesho_price: "499", mrp: "999", inventory: "5", wrong_defective_returns_price: "300", measurements: {} },
        { id: "2", variation: "M", color: "Red", length: "", meesho_price: "499", mrp: "999", inventory: "5", wrong_defective_returns_price: "300", measurements: {} },
      ],
    }), 0);
    const b = assembleProduct(sku({ imageUrl: "https://cdn/b.png", variants: [
      { id: "3", variation: "Free Size", color: "Blue", length: "", meesho_price: "699", mrp: "1299", inventory: "3", wrong_defective_returns_price: "400", measurements: {} },
    ] }), 1);

    expect(a.group_id).toBe("PN-G1");
    expect(b.group_id).toBe("PN-G2");
    expect(a.images).toEqual(["https://cdn/a.png"]);
    expect(a.variants).toHaveLength(2);
    expect(a.variants.every((v) => v.meesho_price === "499")).toBe(true);
    expect(b.variants[0].mrp).toBe("1299");
  });
});
