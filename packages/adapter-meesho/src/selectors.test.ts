import { describe, it, expect } from "vitest";
import { SELECTOR_CONFIGS } from "./selectors.js";

const REQUIRED_KEYS = ["title", "description", "hsnCode", "sellingPrice", "submit"] as const;

describe("SELECTOR_CONFIGS", () => {
  it("defines all required fields on the fixture config", () => {
    for (const key of REQUIRED_KEYS) {
      expect(SELECTOR_CONFIGS.fixture).toHaveProperty(key);
    }
  });

  it("defines all required fields on the live config", () => {
    for (const key of REQUIRED_KEYS) {
      expect(SELECTOR_CONFIGS.live).toHaveProperty(key);
    }
  });

  it("uses the fixture's real DOM ids", () => {
    expect(SELECTOR_CONFIGS.fixture.title).toBe("#title");
  });

  it("targets the live Meesho step-1 fields by stable name attribute", () => {
    // Meesho's Emotion class names are randomized; the `name` attributes on the
    // Product Name / Description textareas are stable, so we target those.
    expect(SELECTOR_CONFIGS.live.title).toBe('textarea[name="product_name"]');
    expect(SELECTOR_CONFIGS.live.description).toBe('textarea[name="comment"]');
  });

  it("marks step-1-absent fields as empty (skipped, not mis-targeted)", () => {
    // HSN, selling price, and the attribute dropdowns are on later wizard steps.
    expect(SELECTOR_CONFIGS.live.hsnCode).toBe("");
    expect(SELECTOR_CONFIGS.live.sellingPrice).toBe("");
  });
});
