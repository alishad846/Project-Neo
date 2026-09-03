import { computeMargin, computeBreakeven, resolveRuleSet, type SkuCosting } from "@neo/rules-engine";

export interface ProfitCalcInputs {
  sellingPrice: number;
  costPrice: number;
  weightKg: number;
  category: string;
  // Percentage (0-100). Leave undefined/blank to fall back to the category default.
  returnRatePercent?: number;
}

export interface ProfitCalcResult {
  profit: number;
  marginPct: number;
  breakeven: number;
}

// Pure: no network, no globals. All cost constants come from resolveRuleSet(on),
// the same effective-dated RuleSet the Price Manager and backend pricing engine use.
export function calcProfit(inputs: ProfitCalcInputs, on: Date = new Date()): ProfitCalcResult | null {
  const { sellingPrice, costPrice, weightKg, category, returnRatePercent } = inputs;

  if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) return null;
  if (!Number.isFinite(costPrice) || costPrice < 0) return null;
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null;

  const rules = resolveRuleSet(on);
  const sku: SkuCosting = {
    sku: "calc",
    currentPrice: sellingPrice,
    baseCost: costPrice,
    weightKg,
    category,
    returnRate:
      returnRatePercent != null && Number.isFinite(returnRatePercent)
        ? returnRatePercent / 100
        : undefined,
  };

  const profit = computeMargin(sku, sellingPrice, rules);
  const marginPct = (profit / sellingPrice) * 100;
  const breakeven = computeBreakeven(sku, rules);

  return { profit, marginPct, breakeven };
}
