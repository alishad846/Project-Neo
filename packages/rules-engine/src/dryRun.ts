import { resolveRuleSet } from "./rules.js";
import { computeMargin, computeBreakeven, computeProposedPrice, type PricingRule, type SkuCosting } from "./margin.js";

export interface SkuDiff {
  sku: string;
  currentPrice: number;
  proposedPrice: number;
  currentMargin: number;
  proposedMargin: number;
  breakeven: number;
  floorApplied: boolean;
  belowBreakeven: boolean;
}

export interface DryRunResult {
  ruleSummary: string;
  totalSkus: number;
  totalMarginDelta: number;
  diffs: SkuDiff[];
}

export function executeDryRun(rule: PricingRule, skus: SkuCosting[], on: Date): DryRunResult {
  const rules = resolveRuleSet(on);
  const diffs: SkuDiff[] = skus.map((sku) => {
    const currentMargin = computeMargin(sku, sku.currentPrice, rules);
    const breakeven = computeBreakeven(sku, rules);
    const proposedPrice = computeProposedPrice(rule, sku, rules);
    const proposedMargin = computeMargin(sku, proposedPrice, rules);
    return {
      sku: sku.sku,
      currentPrice: sku.currentPrice,
      proposedPrice,
      currentMargin,
      proposedMargin,
      breakeven,
      floorApplied: rule.floorPrice != null && proposedPrice === rule.floorPrice,
      belowBreakeven: proposedPrice <= breakeven + 0.001,
    };
  });
  const totalMarginDelta = diffs.reduce((t, d) => t + (d.proposedMargin - d.currentMargin), 0);
  return { ruleSummary: `${rule.actionType} ${rule.actionValue}`, totalSkus: diffs.length, totalMarginDelta, diffs };
}
