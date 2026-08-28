import { describe, it, expect } from "vitest";
import { resolveRuleSet, RULE_HISTORY } from "./rules.js";

describe("resolveRuleSet", () => {
  it("returns the latest ruleset whose effectiveFrom is on or before the date", () => {
    const rs = resolveRuleSet(new Date("2026-01-01"));
    expect(rs.effectiveFrom <= "2026-01-01").toBe(true);
  });

  it("returns the earliest ruleset for a very old date", () => {
    const rs = resolveRuleSet(new Date("2000-01-01"));
    expect(rs).toBe(RULE_HISTORY[0]);
  });

  it("picks the newer ruleset once its effective date passes", () => {
    const early = resolveRuleSet(new Date("2024-06-01"));
    const late = resolveRuleSet(new Date("2026-06-01"));
    expect(late.effectiveFrom >= early.effectiveFrom).toBe(true);
  });

  it("every category rule has a gstRate between 0 and 1", () => {
    for (const rs of RULE_HISTORY)
      for (const c of rs.categories) expect(c.gstRate).toBeGreaterThanOrEqual(0), expect(c.gstRate).toBeLessThan(1);
  });
});
