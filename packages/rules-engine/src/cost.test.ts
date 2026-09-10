import { describe, it, expect } from "vitest";
import { resolveRuleSet } from "./rules.js";
import { computeCost, breakevenPrice, type CostInputs } from "./cost.js";

const rules = resolveRuleSet(new Date("2026-01-01"));

describe("computeCost", () => {
  it("Meesho 0-commission: subtracts shipping + fee-GST + costs, not commission", () => {
    // S=500, mfg=250, shipping=56, pkg=5, return=0, commission=0, collection=0
    const inp: CostInputs = { sellingPrice: 500, manufacturingCost: 250, shippingCharge: 56,
      packagingFee: 5, returnRate: 0, commissionRate: 0, gstRate: 0.05 };
    const r = computeCost(inp, rules);
    // fees = shipping 56; feeGst = 0.18*56 = 10.08; net = 500 - 56 - 10.08 - 250 - 5 = 178.92
    expect(r.netProfit).toBeCloseTo(178.92, 2);
    expect(r.marginPct).toBeCloseTo(35.784, 2);
  });

  it("Flipkart-style commission + collection are % of price and GST-charged", () => {
    // S=1000, mfg=400, commission=0.10, collection=0.02, shipping=72, pkg=5, return=0
    const inp: CostInputs = { sellingPrice: 1000, manufacturingCost: 400, commissionRate: 0.10,
      collectionRate: 0.02, shippingCharge: 72, packagingFee: 5, returnRate: 0, gstRate: 0.05 };
    const r = computeCost(inp, rules);
    // a=0.12; flat F=72; feeGst=0.18
    // net = 1000*(1-0.12*1.18) - (72*1.18 + 400 + 5 + 0)
    //     = 1000*0.8584 - (84.96 + 405) = 858.4 - 489.96 = 368.44
    expect(r.netProfit).toBeCloseTo(368.44, 2);
  });

  it("returns provision scales with return rate", () => {
    const base: CostInputs = { sellingPrice: 500, manufacturingCost: 250, shippingCharge: 56, returnRate: 0 };
    const hi: CostInputs = { ...base, returnRate: 0.3 };
    expect(computeCost(hi, rules).netProfit).toBeLessThan(computeCost(base, rules).netProfit);
  });

  it("gstComponent is reported but NOT subtracted from netProfit", () => {
    const inp: CostInputs = { sellingPrice: 525, manufacturingCost: 200, shippingCharge: 0,
      packagingFee: 0, returnRate: 0, commissionRate: 0, gstRate: 0.05 };
    const r = computeCost(inp, rules);
    expect(r.gstComponent).toBeCloseTo(525 * 0.05 / 1.05, 2); // = 25
    expect(r.netProfit).toBeCloseTo(525 - 200, 2);            // GST not deducted
  });

  it("records which inputs fell back to defaults", () => {
    const r = computeCost({ sellingPrice: 500, manufacturingCost: 250 }, rules);
    expect(r.defaultsUsed).toEqual(expect.arrayContaining(["commissionRate", "shippingCharge", "returnRate"]));
  });
});

describe("CostLine keys", () => {
  it("every CostLine carries a stable key", () => {
    const r = computeCost({ sellingPrice: 500, manufacturingCost: 250 }, rules);
    const keys = r.lines.map((l) => l.key);
    expect(keys).toEqual(expect.arrayContaining(["commission","collection","fixedFee","shipping","feeGst","manufacturing","packaging","returns","gstInfo"]));
  });
});

describe("breakevenPrice", () => {
  it("is the price where netProfit is ~0 (round trip)", () => {
    const inp: CostInputs = { sellingPrice: 999, manufacturingCost: 300, commissionRate: 0.10,
      collectionRate: 0.02, shippingCharge: 72, packagingFee: 5, returnRate: 0.15 };
    const be = breakevenPrice(inp, rules);
    const r = computeCost({ ...inp, sellingPrice: be }, rules);
    expect(Math.abs(r.netProfit)).toBeLessThan(0.01);
  });
});
