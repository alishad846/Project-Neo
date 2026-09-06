import type { RuleSet } from "./rules.js";

export interface CostInputs {
  sellingPrice: number;
  manufacturingCost: number;
  commissionRate?: number;
  returnRate?: number;
  shippingCharge?: number;
  packagingFee?: number;
  gstRate?: number;
  fixedFee?: number;
  collectionRate?: number;
}
export interface CostLine { label: string; amount: number; kind: "cost" | "info"; }
export interface CostBreakdown {
  netProfit: number; marginPct: number; breakeven: number;
  gstComponent: number; lines: CostLine[]; defaultsUsed: string[];
}

// Defaults come from the "*" fallback category and the smallest shipping slab,
// because the marketplace-agnostic calculator has no weight/category.
function starRule(rules: RuleSet) {
  return rules.categories.find((c) => c.category === "*") ?? rules.categories[0];
}
function defaultShipping(rules: RuleSet) {
  return rules.shipping[0]?.charge ?? 0;
}

interface Resolved {
  commissionRate: number; returnRate: number; shippingCharge: number;
  packagingFee: number; gstRate: number; fixedFee: number; collectionRate: number;
  defaultsUsed: string[];
}
function resolve(inputs: CostInputs, rules: RuleSet): Resolved {
  const star = starRule(rules);
  const defaultsUsed: string[] = [];
  const pick = <T>(v: T | undefined, fallback: T, name: string): T => {
    if (v === undefined || (typeof v === "number" && !Number.isFinite(v))) {
      defaultsUsed.push(name); return fallback;
    }
    return v;
  };
  return {
    commissionRate: pick(inputs.commissionRate, star.commissionRate, "commissionRate"),
    returnRate: pick(inputs.returnRate, star.defaultReturnRate, "returnRate"),
    shippingCharge: pick(inputs.shippingCharge, defaultShipping(rules), "shippingCharge"),
    packagingFee: pick(inputs.packagingFee, rules.margin.packagingFee, "packagingFee"),
    gstRate: pick(inputs.gstRate, star.gstRate, "gstRate"),
    fixedFee: pick(inputs.fixedFee, star.fixedFee ?? 0, "fixedFee"),
    collectionRate: pick(inputs.collectionRate, star.collectionRate ?? 0, "collectionRate"),
    defaultsUsed,
  };
}

function flatBurden(r: Resolved, mfg: number, rules: RuleSet): number {
  const returnLoss = r.returnRate * (rules.margin.returnShippingCost + rules.margin.defectRate * mfg);
  const F = r.fixedFee + r.shippingCharge;
  return F * (1 + rules.margin.feeGstRate) + mfg + r.packagingFee + returnLoss;
}
function rateBurden(r: Resolved, rules: RuleSet): number {
  const a = r.commissionRate + r.collectionRate;
  return a * (1 + rules.margin.feeGstRate); // fraction of S consumed by %-fees + their GST
}

export function computeCost(inputs: CostInputs, rules: RuleSet): CostBreakdown {
  const S = inputs.sellingPrice;
  const mfg = inputs.manufacturingCost;
  const r = resolve(inputs, rules);
  const feeGst = rules.margin.feeGstRate;

  const commission = r.commissionRate * S;
  const collection = r.collectionRate * S;
  const feeGstAmount = feeGst * (commission + collection + r.fixedFee + r.shippingCharge);
  const returnLoss = r.returnRate * (rules.margin.returnShippingCost + rules.margin.defectRate * mfg);

  const netProfit =
    S - commission - collection - r.fixedFee - r.shippingCharge - feeGstAmount - mfg - r.packagingFee - returnLoss;
  const marginPct = S > 0 ? (netProfit / S) * 100 : 0;
  const gstComponent = (S * r.gstRate) / (1 + r.gstRate);

  const lines: CostLine[] = [
    { label: "Commission", amount: commission, kind: "cost" },
    { label: "Collection fee", amount: collection, kind: "cost" },
    { label: "Fixed fee", amount: r.fixedFee, kind: "cost" },
    { label: "Shipping", amount: r.shippingCharge, kind: "cost" },
    { label: "GST on fees (18%)", amount: feeGstAmount, kind: "cost" },
    { label: "Manufacturing cost", amount: mfg, kind: "cost" },
    { label: "Packaging", amount: r.packagingFee, kind: "cost" },
    { label: "Returns provision", amount: returnLoss, kind: "cost" },
    { label: "GST you collect (remit / claim ITC)", amount: gstComponent, kind: "info" },
  ];

  return { netProfit, marginPct, breakeven: breakevenPrice(inputs, rules), gstComponent, lines, defaultsUsed: r.defaultsUsed };
}

// netProfit(S) = S*denomFor(inputs,rules) - flatFor(inputs,rules); exported so
// callers (e.g. TARGET_MARGIN pricing) can solve for a price at a target
// netProfit without duplicating this algebra: S = (flat + target) / denom.
export function denomFor(inputs: CostInputs, rules: RuleSet): number {
  const r = resolve(inputs, rules);
  return 1 - rateBurden(r, rules);
}
export function flatFor(inputs: CostInputs, rules: RuleSet): number {
  const r = resolve(inputs, rules);
  return flatBurden(r, inputs.manufacturingCost, rules);
}

export function breakevenPrice(inputs: CostInputs, rules: RuleSet): number {
  const denom = denomFor(inputs, rules);
  if (denom <= 0) return Infinity; // %-fees alone exceed the price — unsellable
  return flatFor(inputs, rules) / denom;
}
