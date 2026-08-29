import type { RuleSet, CategoryRule, ShippingSlab } from "./rules.js";

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

// Net margin at a given price. Preserves the original PricingEngine formula,
// but every constant now comes from the effective-dated RuleSet.
export function computeMargin(sku: SkuCosting, price: number, rules: RuleSet): number {
  const cat = categoryFor(sku.category, rules);
  const x = sku.returnRate ?? cat.defaultReturnRate;
  const k = 1 - x;
  const C = sku.baseCost;
  const P = rules.margin.packagingFee;
  const Ship = shippingFor(sku.weightKg, rules);
  const gst = cat.gstRate;

  const revenue = k * price;
  const cogs = k * C;
  const returnLoss = x * rules.margin.returnShippingCost + x * rules.margin.defectRate * C;
  const shipGst = k * rules.margin.shippingGstRate * Ship;
  const productGst = k * ((price * gst) / (1 + gst));

  return revenue - (cogs + P + returnLoss + shipGst + productGst);
}

// The price at which net margin is zero.
export function computeBreakeven(sku: SkuCosting, rules: RuleSet): number {
  const cat = categoryFor(sku.category, rules);
  const x = sku.returnRate ?? cat.defaultReturnRate;
  const k = 1 - x;
  const C = sku.baseCost;
  const P = rules.margin.packagingFee;
  const Ship = shippingFor(sku.weightKg, rules);
  const gst = cat.gstRate;

  const numerator = P + x * rules.margin.returnShippingCost + x * rules.margin.defectRate * C;
  const base = numerator / k + C + rules.margin.shippingGstRate * Ship;
  return base * (1 + gst);
}

export function computeProposedPrice(rule: PricingRule, sku: SkuCosting, rules: RuleSet): number {
  let price: number;
  switch (rule.actionType) {
    case "PERCENTAGE_DISCOUNT": price = sku.currentPrice * (1 - rule.actionValue / 100); break;
    case "FLAT_DISCOUNT": price = sku.currentPrice - rule.actionValue; break;
    case "SET_FIXED": price = rule.actionValue; break;
    case "TARGET_MARGIN": {
      const cat = categoryFor(sku.category, rules);
      const x = sku.returnRate ?? cat.defaultReturnRate;
      const k = 1 - x;
      const C = sku.baseCost;
      const P = rules.margin.packagingFee;
      const Ship = shippingFor(sku.weightKg, rules);
      const gst = cat.gstRate;
      const num = rule.actionValue + P + x * rules.margin.returnShippingCost + x * rules.margin.defectRate * C;
      price = (num / k + C + rules.margin.shippingGstRate * Ship) * (1 + gst);
      break;
    }
    default: price = sku.currentPrice;
  }

  if (rule.floorPrice != null && price < rule.floorPrice) price = rule.floorPrice;
  const breakeven = computeBreakeven(sku, rules);
  if (price < breakeven) price = breakeven;
  if (rule.roundTo99) {
    price = Math.floor(price / 100) * 100 + 99;
    if (price < breakeven) price += 100; // next .99 tier keeps it at/above breakeven
  }
  return price;
}
