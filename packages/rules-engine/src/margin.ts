import type { RuleSet, CategoryRule, ShippingSlab } from "./rules.js";
import { computeCost, breakevenPrice, denomFor, flatFor, type CostInputs } from "./cost.js";

export interface SkuCosting {
  sku: string;
  currentPrice: number;
  baseCost: number;
  weightKg: number;
  category: string;
  returnRate?: number;
}

export interface PricingRule {
  actionType: "PERCENTAGE_DISCOUNT" | "FLAT_DISCOUNT" | "SET_FIXED" | "TARGET_MARGIN";
  actionValue: number;
  floorPrice?: number;
  roundTo99?: boolean;
  floorBreakeven?: boolean;
  roundToCharm?: boolean;
}

// Nearest charm price ending in 9, at ₹10 granularity: 10→9, 150→149, 200→199.
export function roundToCharm(price: number): number {
  if (!Number.isFinite(price) || price < 10) return price;
  return Math.round(price / 10) * 10 - 1;
}

function categoryFor(category: string, rules: RuleSet): CategoryRule {
  let best: CategoryRule | undefined;
  for (const c of rules.categories) {
    if (c.category === "*") continue;
    if (category.startsWith(c.category) && (!best || c.category.length > best.category.length)) {
      best = c;
    }
  }
  return best
    ?? rules.categories.find((c) => c.category === "*")
    ?? rules.categories[0];
}

function shippingFor(weightKg: number, rules: RuleSet): number {
  const slab: ShippingSlab | undefined = rules.shipping.find((s) => weightKg <= s.maxWeightKg);
  return (slab ?? rules.shipping[rules.shipping.length - 1]).charge;
}

// Builds the shared-core CostInputs for a SKU at a given price, resolving
// category -> rates and weight -> shipping charge from the RuleSet.
function toCostInputs(sku: SkuCosting, price: number, rules: RuleSet): CostInputs {
  const cat = categoryFor(sku.category, rules);
  return {
    sellingPrice: price,
    manufacturingCost: sku.baseCost,
    commissionRate: cat.commissionRate,
    returnRate: sku.returnRate ?? cat.defaultReturnRate,
    shippingCharge: shippingFor(sku.weightKg, rules),
    packagingFee: rules.margin.packagingFee,
    gstRate: cat.gstRate,
    fixedFee: cat.fixedFee ?? 0,
    collectionRate: cat.collectionRate ?? 0,
  };
}

// Net margin at a given price. Delegates to the shared cost core so there is
// one arithmetic implementation shared with the Price Manager / cost.ts.
export function computeMargin(sku: SkuCosting, price: number, rules: RuleSet): number {
  return computeCost(toCostInputs(sku, price, rules), rules).netProfit;
}

// The price at which net margin is zero.
export function computeBreakeven(sku: SkuCosting, rules: RuleSet): number {
  return breakevenPrice(toCostInputs(sku, sku.currentPrice, rules), rules);
}

export function computeProposedPrice(rule: PricingRule, sku: SkuCosting, rules: RuleSet): number {
  let price: number;
  switch (rule.actionType) {
    case "PERCENTAGE_DISCOUNT": price = sku.currentPrice * (1 - rule.actionValue / 100); break;
    case "FLAT_DISCOUNT": price = sku.currentPrice - rule.actionValue; break;
    case "SET_FIXED": price = rule.actionValue; break;
    case "TARGET_MARGIN": {
      // netProfit(S) = S*denom - flat (shared cost core), so solve directly
      // for the price whose netProfit equals the target: S = (flat + target) / denom.
      const ci = toCostInputs(sku, sku.currentPrice, rules);
      const denom = denomFor(ci, rules);
      const flat = flatFor(ci, rules);
      price = denom > 0 ? (flat + rule.actionValue) / denom : sku.currentPrice;
      break;
    }
    default: price = sku.currentPrice;
  }

  if (rule.floorPrice != null && price < rule.floorPrice) price = rule.floorPrice;
  const floor = rule.floorBreakeven !== false;       // default true
  const breakeven = computeBreakeven(sku, rules);
  if (floor && price < breakeven) price = breakeven;
  if (rule.roundToCharm) {
    price = roundToCharm(price);
    if (floor) while (price < breakeven) price += 10;  // next ₹9 tier stays at/above breakeven
  } else if (rule.roundTo99) {
    price = Math.floor(price / 100) * 100 + 99;
    if (floor && price < breakeven) price += 100;
  }
  return price;
}
