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

// Return rate must stay strictly below 100% for the margin formulas' (1 - returnRate)
// denominator to stay positive; cap well under that so results stay sane.
export const MAX_RETURN_RATE_PERCENT = 95;

export type ProfitCalcError = { kind: "invalid-inputs" } | { kind: "return-rate-too-high" };

export type ProfitCalcOutcome =
  | { ok: true; result: ProfitCalcResult }
  | { ok: false; error: ProfitCalcError };

// Pure: no network, no globals. All cost constants come from resolveRuleSet(on),
// the same effective-dated RuleSet the Price Manager and backend pricing engine use.
export function calcProfit(inputs: ProfitCalcInputs, on: Date = new Date()): ProfitCalcOutcome {
  const { sellingPrice, costPrice, weightKg, category, returnRatePercent } = inputs;

  if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) return { ok: false, error: { kind: "invalid-inputs" } };
  if (!Number.isFinite(costPrice) || costPrice < 0) return { ok: false, error: { kind: "invalid-inputs" } };
  if (!Number.isFinite(weightKg) || weightKg <= 0) return { ok: false, error: { kind: "invalid-inputs" } };

  if (returnRatePercent != null && Number.isFinite(returnRatePercent) && returnRatePercent >= MAX_RETURN_RATE_PERCENT) {
    return { ok: false, error: { kind: "return-rate-too-high" } };
  }

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

  if (!Number.isFinite(profit) || !Number.isFinite(marginPct) || !Number.isFinite(breakeven)) {
    return { ok: false, error: { kind: "return-rate-too-high" } };
  }

  return { ok: true, result: { profit, marginPct, breakeven } };
}
