export interface MarginConstants {
  packagingFee: number;      // flat per-order packaging cost (was P)
  returnShippingCost: number;// cost of a returned shipment (was R_ship)
  defectRate: number;        // fraction of returns that are unsellable (was d)
  shippingGstRate: number;   // GST applied to the shipping charge (was 0.18)
}

export interface CategoryRule {
  category: string;          // matches ProductGenome.category prefix; "*" is the fallback
  gstRate: number;           // product GST as a fraction (e.g. 0.05)
  defaultReturnRate: number; // expected RTO/return fraction when not known per-SKU
}

export interface ShippingSlab {
  maxWeightKg: number;       // inclusive upper bound for this slab
  charge: number;            // forward shipping charge for the slab
}

export interface RuleSet {
  effectiveFrom: string;     // ISO date "YYYY-MM-DD"
  margin: MarginConstants;
  categories: CategoryRule[];
  shipping: ShippingSlab[];
}

// Effective-dated rules. Newest entries go last. These replace the constants
// that were previously hardcoded inside PricingEngine.
export const RULE_HISTORY: RuleSet[] = [
  {
    effectiveFrom: "2024-01-01",
    margin: { packagingFee: 5, returnShippingCost: 160, defectRate: 0.1, shippingGstRate: 0.18 },
    categories: [
      { category: "Women > Kurtis", gstRate: 0.05, defaultReturnRate: 0.15 },
      { category: "Women > Sarees", gstRate: 0.05, defaultReturnRate: 0.12 },
      { category: "*", gstRate: 0.05, defaultReturnRate: 0.15 },
    ],
    shipping: [
      { maxWeightKg: 0.5, charge: 56 },
      { maxWeightKg: 1, charge: 72 },
      { maxWeightKg: Infinity, charge: 95 },
    ],
  },
];

export function resolveRuleSet(on: Date): RuleSet {
  const iso = on.toISOString().slice(0, 10);
  let chosen = RULE_HISTORY[0];
  for (const rs of RULE_HISTORY) if (rs.effectiveFrom <= iso) chosen = rs;
  return chosen;
}
