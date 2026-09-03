import { describe, it, expect } from "vitest";
import { compile } from "./compile.js";
import type { ProductGenome } from "@neo/genome";

const baseGenome: ProductGenome = {
  id: 1,
  sellerId: "seller_demo",
  sku: "KURTI-001",
  title: "Printed Cotton Kurti",
  brand: "NeoDemo",
  category: "Women > Kurtis",
  colour: "Blue",
  fabric: "Cotton",
  sizes: ["S", "M", "L"],
  weight: "0.30",
  dimensions: null,
  hsnCode: "6204",
  costPrice: "250.00",
  sellingPrice: "699.00",
  images: ["https://example.com/a.jpg"],
  attributes: {
    pattern: "Printed",
    occasion: "Casual",
    neckType: "Round Neck",
    description: "A comfy kurti.",
    keywords: ["kurti", "cotton"],
  },
  version: 1,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("compile", () => {
  it("maps genome fields into Meesho-shaped listing fields", () => {
    const listing = compile(baseGenome, "Women > Kurtis");
    expect(listing.adapterId).toBe("meesho");
    expect(listing.genomeVersion).toBe(1);
    expect(listing.fields.title).toBe("Printed Cotton Kurti");
    expect(listing.fields.description).toBe("A comfy kurti.");
    expect(listing.fields.keywords).toEqual(["kurti", "cotton"]);
    expect(listing.fields.neckType).toBe("Round Neck");
    expect(listing.fields.hsnCode).toBe("6204");
  });

  it("defaults missing optional fields safely instead of throwing", () => {
    const sparse: ProductGenome = { ...baseGenome, title: null, attributes: {}, images: null };
    const listing = compile(sparse, "Women > Kurtis");
    expect(listing.fields.title).toBe("");
    expect(listing.fields.description).toBe("");
    expect(listing.fields.images).toEqual([]);
  });

  it("is pure: the same input always produces the same output", () => {
    const a = compile(baseGenome, "Women > Kurtis");
    const b = compile(baseGenome, "Women > Kurtis");
    expect(a).toEqual(b);
  });
});
