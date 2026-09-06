import { describe, it, expect } from "vitest";
import { resolveRuleSet, type RuleSet } from "./rules.js";
import { computeMargin, computeBreakeven, computeProposedPrice, roundToCharm, type SkuCosting } from "./margin.js";

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
  it("a percentage discount lowers price but never below breakeven", () => {
    const be = computeBreakeven(sku, rules);
    const p = computeProposedPrice({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 10 }, sku, rules);
    expect(p).toBeLessThan(sku.currentPrice);
    expect(p).toBeGreaterThanOrEqual(be - 0.001);
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
      margin: { packagingFee: 0, returnShippingCost: 0, defectRate: 0, shippingGstRate: 0, feeGstRate: 0 },
      categories: [{ category: "*", gstRate: 0, defaultReturnRate: 0, commissionRate: 0 }],
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

  it("hits the target margin exactly for TARGET_MARGIN rules", () => {
    expect(computeMargin(sku, computeProposedPrice({ actionType: "TARGET_MARGIN", actionValue: 150 }, sku, rules), rules)).toBeCloseTo(150, 1);
  });

  it("clamps a deep discount up to breakeven, never below", () => {
    const be = computeBreakeven(sku, rules);
    const p = computeProposedPrice({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 95 }, sku, rules);
    expect(p).toBeGreaterThanOrEqual(be - 0.001);
  });
  it("round-to-99 result stays at/above breakeven", () => {
    const be = computeBreakeven(sku, rules);
    const p = computeProposedPrice({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 50, roundTo99: true }, sku, rules);
    expect(p).toBeGreaterThanOrEqual(be - 0.001);
    expect(Math.round(p) % 100).toBe(99);
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
      margin: { packagingFee: 5, returnShippingCost: 160, defectRate: 0.1, shippingGstRate: 0.18, feeGstRate: 0.18 },
      categories: [
        { category: "Women > Kurtis", gstRate: 0.05, defaultReturnRate: 0.15, commissionRate: 0 },
        { category: "*", gstRate: 0.18, defaultReturnRate: 0.5, commissionRate: 0 },
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

describe("roundToCharm (customer-appeal ₹__99 / ₹_9 / ₹9)", () => {
  it.each([[8,9],[9,9],[10,9],[45,49],[90,89],[100,99],[125,99],[150,199],[200,199],[499,499],[609,599],[650,699]])(
    "%i → %i", (input, expected) => expect(roundToCharm(input)).toBe(expected));
});
describe("computeProposedPrice floorBreakeven + roundToCharm", () => {
  it("floorBreakeven:false lets a deep discount fall below breakeven", () => {
    const be = computeBreakeven(sku, rules);
    const p = computeProposedPrice({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 95, floorBreakeven: false }, sku, rules);
    expect(p).toBeLessThan(be);
  });
  it("floorBreakeven default (true) still clamps at breakeven", () => {
    const be = computeBreakeven(sku, rules);
    const p = computeProposedPrice({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 95 }, sku, rules);
    expect(p).toBeGreaterThanOrEqual(be - 0.001);
  });
  it("roundToCharm yields a price ending in 9 and stays >= breakeven when floored", () => {
    const be = computeBreakeven(sku, rules);
    const p = computeProposedPrice({ actionType: "PERCENTAGE_DISCOUNT", actionValue: 30, roundToCharm: true }, sku, rules);
    expect(Math.round(p) % 10).toBe(9);
    expect(p).toBeGreaterThanOrEqual(be - 0.001);
  });
});
