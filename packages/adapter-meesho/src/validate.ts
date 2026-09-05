import type { CompiledListing, ValidationIssue } from "@neo/adapter";

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 2000;

export function validate(listing: CompiledListing): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const f = listing.fields;

  const title = typeof f.title === "string" ? f.title : typeof f.product_name === "string" ? f.product_name : "";
  if (!title.trim()) {
    issues.push({ field: "title", severity: "error", message: "Title is required." });
  } else if (title.length > TITLE_MAX) {
    issues.push({ field: "title", severity: "error", message: `Title exceeds Meesho's ${TITLE_MAX}-character limit.` });
  }

  const description = typeof f.description === "string" ? f.description : "";
  if (!description.trim()) {
    issues.push({ field: "description", severity: "error", message: "Description is required." });
  } else if (description.length > DESCRIPTION_MAX) {
    issues.push({ field: "description", severity: "error", message: `Description exceeds Meesho's ${DESCRIPTION_MAX}-character limit.` });
  }

  const hsnCode = typeof f.hsnCode === "string" ? f.hsnCode : typeof f.hsn_id === "string" ? f.hsn_id : "";
  if (!hsnCode.trim()) {
    issues.push({ field: "hsnCode", severity: "error", message: "HSN code is required for Meesho listings." });
  }

  const priceValue = f.meesho_price ?? f.sellingPrice;
  const price = Number(priceValue);
  if (!Number.isFinite(price) || price <= 0) {
    issues.push({ field: "sellingPrice", severity: "error", message: "Selling price must be a positive number." });
  }

  const mrp = Number(f.mrp);
  const wrongReturnPrice = Number(f.wrong_defective_returns_price);

  if (Number.isFinite(price) && Number.isFinite(mrp) && price >= mrp) {
    issues.push({ field: "mrp", severity: "error", message: "Meesho price must be lower than MRP." });
  }

  if (Number.isFinite(wrongReturnPrice) && Number.isFinite(price) && wrongReturnPrice >= price) {
    issues.push({ field: "wrong_defective_returns_price", severity: "error", message: "Wrong/Defective Returns Price must be lower than Meesho price." });
  }

  if (Number.isFinite(wrongReturnPrice) && Number.isFinite(price) && Number.isFinite(mrp) && !(wrongReturnPrice < price && price < mrp)) {
    issues.push({ field: "price_order", severity: "error", message: "Price order must be Wrong/Defective Returns Price < Meesho Price < MRP." });
  }

  const images = Array.isArray(f.images) ? f.images : [];
  if (images.length === 0) {
    issues.push({ field: "images", severity: "warning", message: "No images attached — Meesho listings without images rank poorly." });
  }

  return issues;
}