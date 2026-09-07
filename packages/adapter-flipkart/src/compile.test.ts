import { describe, it, expect } from "vitest";
import { compile } from "./compile.js";
import type { ProductGenome } from "@neo/genome";

describe("compile", () => {
  const baseGenome: ProductGenome = {
    id: 1,
    sellerId: "s_123",
    sku: "SKU123",
    title: "Awesome Shirt",
    brand: "CoolBrand",
    category: "apparel",
    colour: "Red",
    fabric: "Cotton",
    sizes: ["S", "M"],
    weight: "0.50",
    dimensions: null,
    hsnCode: "6109",
    costPrice: "1000.00",
    sellingPrice: "800.00",
    images: ["img1.png"],
    attributes: {
      description: "A very awesome shirt",
      procurementSla: 2
    },
    version: 1,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("maps genome fields correctly", () => {
    const compiled = compile(baseGenome, "c_123");
    
    expect(compiled.adapterId).toBe("flipkart");
    expect(compiled.categoryId).toBe("c_123");
    expect(compiled.genomeVersion).toBe(1);
    
    expect(compiled.fields.productName).toBe("Awesome Shirt");
    expect(compiled.fields.description).toBe("A very awesome shirt");
    expect(compiled.fields.brand).toBe("CoolBrand");
    expect(compiled.fields.mrp).toBe("1000.00");
    expect(compiled.fields.sellingPrice).toBe("800.00");
    expect(compiled.fields.hsnCode).toBe("6109");
    expect(compiled.fields.procurementSla).toBe("2");
  });

  it("defaults missing optional fields safely", () => {
    const emptyGenome = { ...baseGenome, title: undefined, attributes: {}, costPrice: undefined, sellingPrice: undefined, hsnCode: undefined };
    const compiled = compile(emptyGenome as unknown as ProductGenome, "c_123");
    
    expect(compiled.fields.productName).toBe("");
    expect(compiled.fields.description).toBe("");
    expect(compiled.fields.mrp).toBe(0);
    expect(compiled.fields.sellingPrice).toBe(0);
    expect(compiled.fields.hsnCode).toBe("");
    expect(compiled.fields.procurementSla).toBe("3");
    expect(compiled.fields.shippingDays).toBe("");
  });

  it("is pure", () => {
    const compiled1 = compile(baseGenome, "c_123");
    const compiled2 = compile(baseGenome, "c_123");
    expect(compiled1).toEqual(compiled2);
  });
});
