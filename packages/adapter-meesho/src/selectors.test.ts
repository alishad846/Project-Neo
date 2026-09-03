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
});
