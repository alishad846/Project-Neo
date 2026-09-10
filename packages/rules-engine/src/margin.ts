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

// Customer-appeal charm price. Shoppers dislike odd tails like ₹609 but buy a
// clean ₹99 ending, so round to the nearest such price at a magnitude-appropriate
// step: single digit → ₹9; ₹10–99 → nearest ₹_9; ₹100+ → nearest ₹__99.
// Examples: 8→9, 45→49, 100→99, 150→199, 200→199, 609→599, 650→699.
export function roundToCharm(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return price;
  if (price < 10) return 9;                            // single digit → ₹9
  if (price < 100) return Math.round(price / 10) * 10 - 1;   // nearest ₹_9
  return Math.round(price / 100) * 100 - 1;            // nearest ₹__99
}

// Discounts must never become a price increase just because the nearest charm
// price happens to sit above the discounted value. This selects the closest
// charm value at or below the candidate price instead.
function roundDownToCharm(price: number): number {
  if (!Number.isFinite(price) || price <= 0) return price;
  if (price < 10) return price;
  if (price < 100) return Math.floor((price + 1) / 10) * 10 - 1;
  return Math.floor((price + 1) / 100) * 100 - 1;
}

// Return the next charm-price tier after an already rounded value. The tier
// after ₹99 is ₹199; adding ₹10 and rounding again would return ₹99 forever.
function nextCharmPrice(price: number): number {
  if (price < 19) return 19;
  if (price < 99) return Math.floor(price / 10) * 10 + 19;
  return Math.floor(price / 100) * 100 + 199;
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

  const isDiscount = rule.actionType === "PERCENTAGE_DISCOUNT" || rule.actionType === "FLAT_DISCOUNT";
  const priceCeiling = isDiscount ? sku.currentPrice : Infinity;

  if (rule.floorPrice != null && price < rule.floorPrice) price = Math.min(rule.floorPrice, priceCeiling);
  const floor = rule.floorBreakeven !== false;       // default true
  const breakeven = computeBreakeven(sku, rules);
  // A break-even guard protects a viable current price. When a SKU is already
  // below break-even, raising it to that threshold is not a discount; retain
  // its current selling price and surface the loss to the seller instead.
  const protectedFloor = Math.min(breakeven, priceCeiling);
  if (floor && price < protectedFloor) price = protectedFloor;
  if (rule.roundToCharm) {
    price = isDiscount ? roundDownToCharm(price) : roundToCharm(price);
    // If flooring pushed us under break-even, step up to the smallest charm
    // price at or above it. Use explicit tiers so ₹99 correctly advances to
    // ₹199 instead of getting stuck at ₹99 forever.
    while (floor && price < protectedFloor) {
      const next = nextCharmPrice(price);
      if (next > priceCeiling) {
        price = protectedFloor;
        break;
      }
      price = next;
    }
  } else if (rule.roundTo99) {
    price = Math.floor(price / 100) * 100 + 99;
    if (floor && price < protectedFloor) price += 100;
  }
  return Math.min(price, priceCeiling);
}
