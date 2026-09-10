import { describe, it, expect } from "vitest";
import { raceModels } from "./race";

function delayed<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

describe("raceModels", () => {
  it("returns the primary model's result when it answers before the fallback delay", async () => {
    const calls: string[] = [];
    const caller = (model: string) => {
      calls.push(model);
      return model === "quality" ? delayed("primary-response", 10) : delayed("fallback-response", 5);
    };

    const result = await raceModels(caller, "quality", "fast", 50);

    expect(result).toEqual({ response: "primary-response", modelUsed: "quality" });
    expect(calls).toEqual(["quality"]); // fallback never called — primary beat the delay
  });

  it("falls back to the fast model when the primary is slower than the delay", async () => {
    const calls: string[] = [];
    const caller = (model: string) => {
      calls.push(model);
      return model === "quality" ? delayed("primary-response", 200) : delayed("fallback-response", 5);
    };

    const result = await raceModels(caller, "quality", "fast", 20);

    expect(result).toEqual({ response: "fallback-response", modelUsed: "fast" });
    expect(calls).toEqual(["quality", "fast"]);
  });

  it("still uses the primary's result if it settles before the fallback does", async () => {
    const caller = (model: string) => (model === "quality" ? delayed("primary-response", 30) : delayed("fallback-response", 60));

    const result = await raceModels(caller, "quality", "fast", 20);

    expect(result).toEqual({ response: "primary-response", modelUsed: "quality" });
  });

  it("falls back immediately when the primary fails fast (e.g. model not pulled), without waiting out the delay", async () => {
    const calls: string[] = [];
    const caller = (model: string) => {
      calls.push(model);
      // Mirrors callOllamaModel's contract: failures resolve null, they don't reject.
      return model === "quality" ? delayed(null, 5) : delayed("fallback-response", 10);
    };

    const start = Date.now();
    const result = await raceModels(caller, "quality", "fast", 6000);
    const elapsed = Date.now() - start;

    expect(result).toEqual({ response: "fallback-response", modelUsed: "fast" });
    expect(calls).toEqual(["quality", "fast"]);
    expect(elapsed).toBeLessThan(1000); // must not wait out the 6s delay
  });

  it("returns a null response if both the primary and fallback fail", async () => {
    const caller = (model: string) => delayed(null, model === "quality" ? 5 : 10);

    const result = await raceModels(caller, "quality", "fast", 20);

    expect(result.response).toBeNull();
  });
});
