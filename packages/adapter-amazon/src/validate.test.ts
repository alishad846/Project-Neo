import { describe, it, expect } from "vitest";
import { validate } from "./validate.js";
import type { CompiledListing } from "@neo/adapter";

const validListing: CompiledListing = {
  adapterId: "amazon_in",
  categoryId: "cat-1",
  genomeVersion: 1,
  fields: {
    productName: "Test Product",
    description: "Test Description",
    brandName: "TestBrand",
    sellingPrice: "1000",
    hsnCode: "123456",
    images: ["img1.jpg"],
  },
};

describe("validate", () => {
  it("returns empty array for valid listing", () => {
    const issues = validate(validListing);
    expect(issues.length).toBe(0);
  });

  it("returns error for missing title", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, productName: "" } };
    const issues = validate(listing);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "productName", severity: "error" })]));
  });

  it("returns error for title > 200 chars", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, productName: "a".repeat(201) } };
    const issues = validate(listing);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "productName", severity: "error" })]));
  });

  it("returns error for missing description", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, description: "" } };
    const issues = validate(listing);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "description", severity: "error" })]));
  });

  it("returns error for missing brand", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, brandName: "" } };
    const issues = validate(listing);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "brandName", severity: "error" })]));
  });

  it("returns error for non-positive price", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, sellingPrice: "0" } };
    const issues = validate(listing);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "sellingPrice", severity: "error" })]));
  });

  it("returns error for missing HSN code", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, hsnCode: "" } };
    const issues = validate(listing);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "hsnCode", severity: "error" })]));
  });

  it("returns warning for missing images", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, images: [] } };
    const issues = validate(listing);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({ field: "images", severity: "warning" })]));
  });
});
