import type { CompiledListing, ValidationIssue } from "@neo/adapter";

export function validate(listing: CompiledListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { fields } = listing;

  const productName = fields.productName as string;
  if (!productName) {
    issues.push({ field: "productName", severity: "error", message: "Product name is required." });
  } else if (productName.length > 140) {
    issues.push({ field: "productName", severity: "error", message: "Product name cannot exceed 140 characters." });
  }

  const description = fields.description as string;
  if (!description) {
    issues.push({ field: "description", severity: "error", message: "Description is required." });
  } else if (description.length > 5000) {
    issues.push({ field: "description", severity: "error", message: "Description cannot exceed 5000 characters." });
  }

  const brand = fields.brand as string;
  if (!brand) {
    issues.push({ field: "brand", severity: "error", message: "Brand is required." });
  }

  const mrp = Number(fields.mrp);
  if (!Number.isFinite(mrp) || mrp <= 0) {
    issues.push({ field: "mrp", severity: "error", message: "MRP must be a positive number." });
  }

  const sellingPrice = Number(fields.sellingPrice);
  if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
    issues.push({ field: "sellingPrice", severity: "error", message: "Selling price must be a positive number." });
  }

  if (Number.isFinite(sellingPrice) && Number.isFinite(mrp) && sellingPrice > mrp) {
    issues.push({ field: "sellingPrice", severity: "error", message: "Selling price cannot exceed MRP on Flipkart." });
  }

  const hsnCode = fields.hsnCode as string;
  if (!hsnCode) {
    issues.push({ field: "hsnCode", severity: "error", message: "HSN code is required." });
  }

  const images = fields.images as string[];
  if (!images || !Array.isArray(images) || images.length === 0) {
    issues.push({ field: "images", severity: "warning", message: "Missing images." });
  }

  return issues;
}
