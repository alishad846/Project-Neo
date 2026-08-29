import { describe, it, expect } from "vitest";
import { resolveRuleSet, type RuleSet } from "./rules.js";
import { computeMargin, computeBreakeven, computeProposedPrice, type SkuCosting } from "./margin.js";

const rules = resolveRuleSet(new Date("2026-01-01"));
const sku: SkuCosting = { sku: "K1", currentPrice: 899, baseCost: 450, weightKg: 0.4, category: "Women > Kurtis" };

describe("computeMargin", () => {
  it("is lower than gross (price - cost) because of fees and returns", () => {
    const margin = computeMargin(sku, 899, rules);
    expect(margin).toBeLessThan(899 - 450);
  });
  it("decreases as price decreases", () => {
    expect(computeMargin(sku, 700, rules)).toBeLessThan(computeMargin(sku, 899, rules));
  });
});

describe("computeBreakeven", () => {
  it("yields a margin of approximately zero at the breakeven price", () => {
    const be = computeBreakeven(sku, rules);
    expect(Math.abs(computeMargin(sku, be, rules))).toBeLessThan(1);
  });
});

describe("computeProposedPrice", () => {
  it("applies a percentage discount", () => {
    expect(computeProposedPrice({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 }, sku, rules)).toBeCloseTo(809.1, 1);
  });
  it("never goes below the floor price", () => {
    const p = computeProposedPrice({ actionType: "SET_FIXED", actionValue: 100, floorPrice: 300 }, sku, rules);
    expect(p).toBeGreaterThanOrEqual(300);
  });
  it("never goes below breakeven", () => {
    const p = computeProposedPrice({ actionType: "SET_FIXED", actionValue: 1 }, sku, rules);
    expect(p).toBeGreaterThanOrEqual(computeBreakeven(sku, rules) - 0.001);
  });
  it("rounds to .99 when requested", () => {
    const p = computeProposedPrice({ actionType: "SET_FIXED", actionValue: 850, roundTo99: true }, sku, rules);
    expect(p % 100).toBeCloseTo(99, 5);
  });

  it("keeps rounded price at or above breakeven even when rounding would push it below", () => {
    // A zero-fee/zero-return RuleSet makes breakeven exactly equal to baseCost,
    // so we can pick a baseCost whose remainder mod 100 lands in (99, 100) --
    // the window where `floor(price/100)*100+99` rounds DOWN past the price.
    // 699.7: floor(699.7/100)*100+99 = 699, which is < 699.7 -- the pre-fix bug.
    const zeroRules: RuleSet = {
      effectiveFrom: "2024-01-01",
      margin: { packagingFee: 0, returnShippingCost: 0, defectRate: 0, shippingGstRate: 0 },
      categories: [{ category: "*", gstRate: 0, defaultReturnRate: 0 }],
      shipping: [{ maxWeightKg: Infinity, charge: 0 }],
    };
    const roundingSku: SkuCosting = { sku: "R1", currentPrice: 1000, baseCost: 699.7, weightKg: 0.4, category: "Any" };
    const breakeven = computeBreakeven(roundingSku, zeroRules);
    expect(breakeven).toBeCloseTo(699.7, 5);

    const p = computeProposedPrice({ actionType: "SET_FIXED", actionValue: 1, roundTo99: true }, roundingSku, zeroRules);
    expect(p).toBeGreaterThanOrEqual(breakeven);
    // Sanity: still a `.99` price, just bumped to the next tier (799 instead of 699).
    expect(p % 100).toBeCloseTo(99, 5);
    expect(p).toBeCloseTo(799, 5);
  });

  it("hits approximately the target margin for TARGET_MARGIN rules", () => {
    const target = 120;
    const p = computeProposedPrice({ actionType: "TARGET_MARGIN", actionValue: target }, sku, rules);
    expect(computeMargin(sku, p, rules)).toBeCloseTo(target, 1);
  });

  it("uses the floor guard (not the breakeven guard) when floor sits above breakeven", () => {
    const breakeven = computeBreakeven(sku, rules);
    const floor = breakeven + 25; // above breakeven, so breakeven guard alone would not select this value
    const p = computeProposedPrice({ actionType: "SET_FIXED", actionValue: 400, floorPrice: floor }, sku, rules);
    expect(p).toBe(floor);
  });

  it("matches categories by longest prefix, not exact equality", () => {
    const localRules: RuleSet = {
      effectiveFrom: "2024-01-01",
      margin: { packagingFee: 5, returnShippingCost: 160, defectRate: 0.1, shippingGstRate: 0.18 },
      categories: [
        { category: "Women > Kurtis", gstRate: 0.05, defaultReturnRate: 0.15 },
        { category: "*", gstRate: 0.18, defaultReturnRate: 0.5 },
      ],
      shipping: [{ maxWeightKg: Infinity, charge: 56 }],
    };
    const deepSku: SkuCosting = { sku: "K2", currentPrice: 899, baseCost: 450, weightKg: 0.4, category: "Women > Kurtis > Anarkali" };
    const shallowSku: SkuCosting = { ...sku };

    const marginDeep = computeMargin(deepSku, 899, localRules);
    const marginShallow = computeMargin(shallowSku, 899, localRules);
    // Both should resolve to the "Women > Kurtis" rule (gstRate 0.05), not the "*" fallback (0.18).
    expect(marginDeep).toBeCloseTo(marginShallow, 5);
  });
});
