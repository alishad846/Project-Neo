import { describe, it, expect } from "vitest";
import { SELECTOR_CONFIGS } from "./selectors.js";

describe("selectors", () => {
  it("fixture config has all required fields using DOM IDs", () => {
    const { fixture } = SELECTOR_CONFIGS;
    expect(fixture.productName).toBe("#productName");
    expect(fixture.description).toBe("#description");
    expect(fixture.brandName).toBe("#brandName");
    expect(fixture.bulletPoint1).toBe("#bulletPoint1");
    expect(fixture.mrp).toBe("#mrp");
    expect(fixture.sellingPrice).toBe("#sellingPrice");
    expect(fixture.submit).toBe("#submit");
  });

  it("live config uses stable name attributes", () => {
    const { live } = SELECTOR_CONFIGS;
    expect(live.productName).toBe('input[name="item_name"]');
    expect(live.description).toBe('textarea[name="product_description"]');
    expect(live.brandName).toBe('input[name="brand_name"]');
    expect(live.submit).toBe("");
  });
});
