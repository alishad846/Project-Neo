import { describe, it, expect } from "vitest";
import { compile } from "./compile.js";
import type { ProductGenome } from "@neo/genome";

const baseGenome: ProductGenome = {
  id: 1,
  sellerId: "seller-123",
  sku: "TEST-SKU",
  title: "Test Product",
  brand: "TestBrand",
  category: "apparel",
  colour: "Red",
  fabric: "Cotton",
  sizes: ["S", "M"],
  weight: "0.10",
  dimensions: null,
  hsnCode: "123456",
  costPrice: "500.00",
  sellingPrice: "1000.00",
  images: ["img1.jpg"],
  attributes: {
    description: "A great product",
    keywords: ["test", "product"],
    bulletPoints: ["BP 1", "BP 2", "BP 3"],
  },
  version: 1,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("compile", () => {
  it("maps genome fields correctly", () => {
    const compiled = compile(baseGenome, "test-cat");

    expect(compiled.adapterId).toBe("amazon_in");
    expect(compiled.categoryId).toBe("test-cat");
    expect(compiled.fields.productName).toBe("Test Product");
    expect(compiled.fields.description).toBe("A great product");
    expect(compiled.fields.brandName).toBe("TestBrand");
    expect(compiled.fields.bulletPoint1).toBe("BP 1");
    expect(compiled.fields.bulletPoint2).toBe("BP 2");
    expect(compiled.fields.bulletPoint3).toBe("BP 3");
    expect(compiled.fields.searchKeywords).toBe("test, product");
    expect(compiled.fields.sellingPrice).toBe("1000.00");
    expect(compiled.fields.mrp).toBe("500.00");
    expect(compiled.fields.hsnCode).toBe("123456");
    expect(compiled.fields.skuId).toBe("");
  });

  it("defaults missing optional fields safely", () => {
    const minGenome = { ...baseGenome, attributes: {}, title: undefined, brand: undefined };
    const compiled = compile(minGenome as ProductGenome, "test-cat");
    expect(compiled.fields.productName).toBe("");
    expect(compiled.fields.brandName).toBe("");
    expect(compiled.fields.description).toBe("");
    expect(compiled.fields.searchKeywords).toBe("");
    expect(compiled.fields.bulletPoint1).toBe("");
  });
});
