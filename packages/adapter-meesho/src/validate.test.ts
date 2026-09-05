import { describe, it, expect } from "vitest";
import { validate } from "./validate.js";
import type { CompiledListing } from "@neo/adapter";

function listingWith(fields: Partial<CompiledListing["fields"]>): CompiledListing {
  return {
    adapterId: "meesho",
    categoryId: "Women > Kurtis",
    genomeVersion: 1,
    fields: {
      title: "Printed Cotton Kurti",
      description: "A comfy kurti.",
      hsnCode: "6204",
      sellingPrice: "699.00",
      images: ["a.jpg"],
      ...fields,
    },
  };
}

describe("validate", () => {
  it("returns no errors for a complete listing", () => {
    const issues = validate(listingWith({}));
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  it("errors on a missing title", () => {
    const issues = validate(listingWith({ title: "" }));
    expect(issues).toContainEqual(expect.objectContaining({ field: "title", severity: "error" }));
  });

  it("errors on a title over the 100-character limit", () => {
    const issues = validate(listingWith({ title: "x".repeat(101) }));
    expect(issues).toContainEqual(expect.objectContaining({ field: "title", severity: "error" }));
  });

  it("errors on a missing HSN code", () => {
    const issues = validate(listingWith({ hsnCode: "" }));
    expect(issues).toContainEqual(expect.objectContaining({ field: "hsnCode", severity: "error" }));
  });

  it("errors on a non-positive selling price", () => {
    const issues = validate(listingWith({ sellingPrice: "0" }));
    expect(issues).toContainEqual(expect.objectContaining({ field: "sellingPrice", severity: "error" }));
  });

  it("errors when Meesho price is not below MRP", () => {
    const issues = validate(listingWith({ meesho_price: "699", mrp: "699" }));
    expect(issues).toContainEqual(expect.objectContaining({ field: "mrp", severity: "error" }));
  });

  it("errors when wrong/defective returns price is not below Meesho price", () => {
    const issues = validate(listingWith({
      wrong_defective_returns_price: "699",
      meesho_price: "699",
      mrp: "999",
    }));
    expect(issues).toContainEqual(expect.objectContaining({
      field: "wrong_defective_returns_price",
      severity: "error",
    }));
  });

  it("warns (does not error) on missing images", () => {
    const issues = validate(listingWith({ images: [] }));
    const imageIssue = issues.find((i) => i.field === "images");
    expect(imageIssue?.severity).toBe("warning");
    expect(issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});