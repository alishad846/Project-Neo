import { describe, it, expect } from "vitest";
import { NEO_PALETTE } from "./theme.js";
describe("NEO_PALETTE", () => {
  it("exposes the six brand colours as hex", () => {
    expect(NEO_PALETTE.pink).toBe("#ff90e8");
    expect(NEO_PALETTE.cyan).toBe("#00e5ff");
    expect(Object.keys(NEO_PALETTE)).toHaveLength(6);
  });
});
