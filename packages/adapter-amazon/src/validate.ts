import type { CompiledListing, ValidationIssue } from "@neo/adapter";

export function validate(listing: CompiledListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fields = listing.fields;

  const productName = fields.productName as string;
  if (!productName) {
    issues.push({ field: "productName", severity: "error", message: "Product name is required" });
  } else if (productName.length > 200) {
    issues.push({ field: "productName", severity: "error", message: "Product name must be max 200 chars" });
  }

  const description = fields.description as string;
  if (!description) {
    issues.push({ field: "description", severity: "error", message: "Description is required" });
  } else if (description.length > 2000) {
    issues.push({ field: "description", severity: "error", message: "Description must be max 2000 chars" });
  }

  const brandName = fields.brandName as string;
  if (!brandName) {
    issues.push({ field: "brandName", severity: "error", message: "Brand name is required" });
  }

  for (let i = 1; i <= 3; i++) {
    const bp = fields[`bulletPoint${i}`] as string;
    if (bp && bp.length > 500) {
      issues.push({ field: `bulletPoint${i}`, severity: "warning", message: `Bullet point ${i} must be max 500 chars` });
    }
  }

  const price = Number(fields.sellingPrice);
  if (!Number.isFinite(price) || price <= 0) {
    issues.push({ field: "sellingPrice", severity: "error", message: "Selling price must be a positive number" });
  }

  const hsnCode = fields.hsnCode as string;
  if (!hsnCode) {
    issues.push({ field: "hsnCode", severity: "error", message: "HSN code is required" });
  }

  const images = fields.images as string[];
  if (!images || images.length === 0) {
    issues.push({ field: "images", severity: "warning", message: "Images array is empty or missing" });
  }

  return issues;
}
