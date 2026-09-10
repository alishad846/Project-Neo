import { computeCost, resolveRuleSet, type CostInputs, type CostBreakdown } from "@neo/rules-engine";

export type ProfitCalcInputs = CostInputs;
export type ProfitCalcResult = CostBreakdown;

export type ProfitCalcOutcome =
  | { ok: true; result: CostBreakdown }
  | { ok: false; error: { kind: "invalid-inputs" } };

// Pure: no network, no globals. All cost constants come from resolveRuleSet(on),
// the same effective-dated RuleSet the Price Manager and backend pricing engine use.
export function calcProfit(inputs: CostInputs, on: Date = new Date()): ProfitCalcOutcome {
  if (!(inputs.sellingPrice > 0) || !(inputs.manufacturingCost >= 0)) {
    return { ok: false, error: { kind: "invalid-inputs" } };
  }
  return { ok: true, result: computeCost(inputs, resolveRuleSet(on)) };
}
