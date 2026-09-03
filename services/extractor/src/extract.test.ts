import { describe, it, expect } from "vitest";
import { extractHeuristic, parseModelResponse } from "./extract";

describe("extractHeuristic", () => {
  it("always reports low confidence and heuristic source", () => {
    const r = extractHeuristic({ category: "Women > Kurtis" });
    expect(r.confidence).toBe("low");
    expect(r.source).toBe("heuristic");
  });

  it("derives saree-specific attributes for saree categories", () => {
    const r = extractHeuristic({ category: "Women > Sarees" });
    expect(r.attributes.sareeLength).toBe("6.3m");
    expect(r.attributes.blousePiece).toBe(true);
  });

  it("derives kurti-specific attributes for kurti/top/dress categories", () => {
    const r = extractHeuristic({ category: "Women > Kurtis" });
    expect(r.attributes.neckType).toBe("Round Neck");
  });

  it("falls back to generic attributes for an unrecognised category", () => {
    const r = extractHeuristic({ category: "Women > Leggings" });
    expect(r.attributes.pattern).toBe("Solid");
    expect(r.attributes.neckType).toBeUndefined();
  });

  it("handles a missing category without throwing", () => {
    expect(() => extractHeuristic({})).not.toThrow();
  });
});

describe("parseModelResponse", () => {
  it("parses a clean JSON response", () => {
    expect(parseModelResponse('{"neckType": "V-Neck", "pattern": "Floral"}'))
      .toEqual({ neckType: "V-Neck", pattern: "Floral" });
  });

  it("extracts a JSON object embedded in prose", () => {
    expect(parseModelResponse('Sure! Here you go: {"pattern": "Solid"} Hope that helps.'))
      .toEqual({ pattern: "Solid" });
  });

  it("returns null for text with no JSON in it", () => {
    expect(parseModelResponse("I cannot determine this from the image.")).toBeNull();
  });

  it("returns null for malformed JSON", () => {
    expect(parseModelResponse("{neckType: broken}")).toBeNull();
  });

  it("parses boolean fields like blousePiece", () => {
    expect(parseModelResponse('{"blousePiece": true}')).toEqual({ blousePiece: true });
  });
});
