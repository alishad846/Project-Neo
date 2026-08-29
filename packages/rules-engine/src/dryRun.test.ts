import { describe, it, expect } from "vitest";
import { executeDryRun } from "./dryRun.js";
import type { SkuCosting } from "./margin.js";

const skus: SkuCosting[] = [
  { sku: "K1", currentPrice: 899, baseCost: 450, weightKg: 0.4, category: "Women > Kurtis" },
  { sku: "K2", currentPrice: 1299, baseCost: 700, weightKg: 0.6, category: "Women > Sarees" },
];

describe("executeDryRun", () => {
  it("returns one diff per SKU", () => {
    const res = executeDryRun({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 5 }, skus, new Date("2026-01-01"));
    expect(res.diffs).toHaveLength(2);
    expect(res.totalSkus).toBe(2);
  });
  it("a discount lowers price and reports a negative margin delta", () => {
    const res = executeDryRun({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 }, skus, new Date("2026-01-01"));
    expect(res.diffs[0].proposedPrice).toBeLessThan(res.diffs[0].currentPrice);
    expect(res.totalMarginDelta).toBeLessThan(0);
  });
  it("flags belowBreakeven when a fixed price is set under breakeven", () => {
    const res = executeDryRun({ actionType: "SET_FIXED", actionValue: 1 }, skus, new Date("2026-01-01"));
    expect(res.diffs[0].belowBreakeven).toBe(true);
  });
});
