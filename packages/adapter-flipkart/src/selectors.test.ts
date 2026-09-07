import { describe, it, expect } from "vitest";
import { SELECTOR_CONFIGS } from "./selectors.js";

describe("selectors", () => {
  it("fixture config has all required fields using DOM IDs", () => {
    expect(SELECTOR_CONFIGS.fixture.productName).toBe("#productName");
    expect(SELECTOR_CONFIGS.fixture.description).toBe("#description");
    expect(SELECTOR_CONFIGS.fixture.brand).toBe("#brand");
    expect(SELECTOR_CONFIGS.fixture.mrp).toBe("#mrp");
    expect(SELECTOR_CONFIGS.fixture.sellingPrice).toBe("#sellingPrice");
    expect(SELECTOR_CONFIGS.fixture.hsnCode).toBe("#hsnCode");
    expect(SELECTOR_CONFIGS.fixture.skuId).toBe("#skuId");
    expect(SELECTOR_CONFIGS.fixture.procurementSla).toBe("#procurementSla");
    expect(SELECTOR_CONFIGS.fixture.stockCount).toBe("#stockCount");
    expect(SELECTOR_CONFIGS.fixture.shippingDays).toBe("#shippingDays");
    expect(SELECTOR_CONFIGS.fixture.submit).toBe("#submit");
  });

  it("live config has all required fields using target attributes", () => {
    expect(SELECTOR_CONFIGS.live.productName).toBe('input[name="product_name"]');
    expect(SELECTOR_CONFIGS.live.description).toBe('textarea[name="description"]');
    expect(SELECTOR_CONFIGS.live.brand).toBe('input[name="brand"]');
    expect(SELECTOR_CONFIGS.live.mrp).toBe('input[name="mrp"]');
    expect(SELECTOR_CONFIGS.live.sellingPrice).toBe('input[name="selling_price"]');
    expect(SELECTOR_CONFIGS.live.hsnCode).toBe('input[name="hsn"]');
    expect(SELECTOR_CONFIGS.live.skuId).toBe('input[name="sku_id"]');
    expect(SELECTOR_CONFIGS.live.procurementSla).toBe('input[name="procurement_sla"]');
    expect(SELECTOR_CONFIGS.live.stockCount).toBe('input[name="stock"]');
    expect(SELECTOR_CONFIGS.live.shippingDays).toBe('input[name="shipping_days"]');
    expect(SELECTOR_CONFIGS.live.submit).toBe("");
  });
});
