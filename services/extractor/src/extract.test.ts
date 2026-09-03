import { describe, it, expect } from "vitest";
import { extractHeuristic, parseModelResponse, parseModelDescription } from "./extract";

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

describe("parseModelDescription", () => {
  it("maps a clothing description with several attributes", () => {
    expect(
      parseModelDescription("A woman in a round neck full sleeve floral kurti for a festive occasion")
    ).toEqual({
      neckType: "Round Neck",
      sleeveLength: "Full Sleeve",
      pattern: "Floral",
      occasion: "Festive",
    });
  });

  it("returns null when no clothing attributes are found (no fabrication)", () => {
    expect(parseModelDescription("a plain green puzzle piece on a black background")).toBeNull();
  });

  it("maps v-neck variants", () => {
    expect(parseModelDescription("This top has a v-neck design")).toEqual({ neckType: "V-Neck" });
  });

  it("maps collar and boat neck", () => {
    expect(parseModelDescription("a shirt with a collar")).toEqual({ neckType: "Collar" });
    expect(parseModelDescription("a top with a boat neck")).toEqual({ neckType: "Boat Neck" });
  });

  it("maps three-quarter and half sleeve variants", () => {
    expect(parseModelDescription("a kurti with three-quarter sleeves")).toEqual({ sleeveLength: "Three-Quarter" });
    expect(parseModelDescription("a top with 3/4 sleeves")).toEqual({ sleeveLength: "Three-Quarter" });
    expect(parseModelDescription("a top with half sleeves")).toEqual({ sleeveLength: "Half Sleeve" });
    expect(parseModelDescription("a sleeveless dress")).toEqual({ sleeveLength: "Sleeveless" });
  });

  it("maps pattern keywords", () => {
    expect(parseModelDescription("a printed dress")).toEqual({ pattern: "Printed" });
    expect(parseModelDescription("a solid plain top")).toEqual({ pattern: "Solid" });
    expect(parseModelDescription("a striped shirt")).toEqual({ pattern: "Striped" });
    expect(parseModelDescription("a checked and checkered plaid pattern")).toEqual({ pattern: "Checked" });
    expect(parseModelDescription("an embroidered kurti")).toEqual({ pattern: "Embroidered" });
  });

  it("maps casual occasion", () => {
    expect(parseModelDescription("a casual everyday top for daily wear")).toEqual({ occasion: "Casual" });
  });

  it("maps blousePiece and sareeLength for saree descriptions", () => {
    expect(parseModelDescription("a saree that comes with a blouse piece, 6.3 metres long")).toEqual({
      blousePiece: true,
      sareeLength: "6.3 metres",
    });
  });

  it("does not fabricate attributes not present in the text", () => {
    const result = parseModelDescription("a round neck top");
    expect(result).toEqual({ neckType: "Round Neck" });
    expect(result).not.toHaveProperty("sleeveLength");
    expect(result).not.toHaveProperty("pattern");
  });
});
