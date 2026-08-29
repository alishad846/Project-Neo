import { describe, it, expect } from "vitest";
import { productGenomeInsertSchema, productGenomeSchema } from "./genome.js";

describe("productGenomeInsertSchema", () => {
  it("accepts a minimal valid insert", () => {
    const parsed = productGenomeInsertSchema.parse({
      sellerId: "seller_1",
      sku: "KURTI-001",
    });
    expect(parsed.sku).toBe("KURTI-001");
  });

  it("rejects a missing sku", () => {
    const result = productGenomeInsertSchema.safeParse({ sellerId: "seller_1" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty sellerId", () => {
    const result = productGenomeInsertSchema.safeParse({ sellerId: "", sku: "X" });
    expect(result.success).toBe(false);
  });

  it("full schema requires id and version", () => {
    const result = productGenomeSchema.safeParse({ sellerId: "s", sku: "X" });
    expect(result.success).toBe(false);
  });
});
