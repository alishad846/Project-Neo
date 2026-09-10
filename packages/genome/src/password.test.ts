import { describe, it, expect } from "vitest";
import { checkPassword, isPasswordValid, passwordScore, passwordSchema } from "./password.js";
describe("password policy", () => {
  it("rejects too-short / missing-class passwords", () => {
    expect(isPasswordValid("short1A")).toBe(false);   // 7 chars
    expect(isPasswordValid("alllowercase1")).toBe(false); // no upper
    expect(isPasswordValid("ALLUPPER1")).toBe(false);  // no lower
    expect(isPasswordValid("NoDigitsHere")).toBe(false); // no digit
  });
  it("accepts a compliant password", () => {
    expect(isPasswordValid("Neo12345")).toBe(true);
    expect(checkPassword("Neo12345")).toMatchObject({ length: true, lower: true, upper: true, digit: true });
  });
  it("scores strength 0..4 and rewards symbols/length", () => {
    expect(passwordScore("aaa")).toBeLessThan(passwordScore("Neo12345"));
    expect(passwordScore("Neo12345!xyz")).toBeGreaterThanOrEqual(passwordScore("Neo12345"));
    expect(passwordScore("Neo12345!xyz")).toBeLessThanOrEqual(4);
  });
  it("passwordSchema parse fails on weak, passes on strong", () => {
    expect(passwordSchema.safeParse("weak").success).toBe(false);
    expect(passwordSchema.safeParse("Neo12345").success).toBe(true);
  });
});
