import { describe, it, expect } from "vitest";
import { validate } from "./validate.js";
import type { CompiledListing } from "@neo/adapter";

describe("validate", () => {
  const validListing: CompiledListing = {
    adapterId: "flipkart",
    categoryId: "c_123",
    genomeVersion: 1,
    fields: {
      productName: "Awesome Shirt",
      description: "A very awesome shirt",
      brand: "CoolBrand",
      mrp: "1000",
      sellingPrice: "800",
      hsnCode: "6109",
      images: ["img1.png"]
    }
  };

  it("returns empty array for valid listing", () => {
    const issues = validate(validListing);
    expect(issues).toHaveLength(0);
  });

  it("returns error for missing product name", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, productName: "" } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "productName", severity: "error", message: "Product name is required." });
  });

  it("returns error for product name > 140 chars", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, productName: "a".repeat(141) } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "productName", severity: "error", message: "Product name cannot exceed 140 characters." });
  });

  it("returns error for missing description", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, description: "" } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "description", severity: "error", message: "Description is required." });
  });

  it("returns error for missing brand", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, brand: "" } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "brand", severity: "error", message: "Brand is required." });
  });

  it("returns error for non-positive MRP", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, mrp: "0" } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "mrp", severity: "error", message: "MRP must be a positive number." });
  });

  it("returns error for non-positive selling price", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, sellingPrice: "-10" } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "sellingPrice", severity: "error", message: "Selling price must be a positive number." });
  });

  it("returns error when selling price > MRP", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, mrp: "1000", sellingPrice: "1200" } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "sellingPrice", severity: "error", message: "Selling price cannot exceed MRP on Flipkart." });
  });

  it("returns error for missing HSN code", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, hsnCode: "" } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "hsnCode", severity: "error", message: "HSN code is required." });
  });

  it("returns warning for missing images", () => {
    const listing = { ...validListing, fields: { ...validListing.fields, images: [] } };
    const issues = validate(listing);
    expect(issues).toContainEqual({ field: "images", severity: "warning", message: "Missing images." });
  });
});
