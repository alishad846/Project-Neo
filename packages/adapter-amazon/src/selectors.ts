export interface AmazonSelectorMap {
  productName: string;
  description: string;
  brandName: string;
  bulletPoint1: string;
  bulletPoint2: string;
  bulletPoint3: string;
  mrp: string;
  sellingPrice: string;
  hsnCode: string;
  skuId: string;
  quantity: string;
  searchKeywords: string;
  submit: string;
}

export type AmazonConfigId = "fixture" | "live";

// Amazon Seller Central uses React with reasonably stable name attributes on form fields, similar to Meesho's approach.
export const SELECTOR_CONFIGS: Record<AmazonConfigId, AmazonSelectorMap> = {
  fixture: {
    productName: "#productName",
    description: "#description",
    brandName: "#brandName",
    bulletPoint1: "#bulletPoint1",
    bulletPoint2: "#bulletPoint2",
    bulletPoint3: "#bulletPoint3",
    mrp: "#mrp",
    sellingPrice: "#sellingPrice",
    hsnCode: "#hsnCode",
    skuId: "#skuId",
    quantity: "#quantity",
    searchKeywords: "#searchKeywords",
    submit: "#submit",
  },
  live: {
    productName: 'input[name="item_name"]',
    description: 'textarea[name="product_description"]',
    brandName: 'input[name="brand_name"]',
    bulletPoint1: 'textarea[name="bullet_point1"]',
    bulletPoint2: 'textarea[name="bullet_point2"]',
    bulletPoint3: 'textarea[name="bullet_point3"]',
    mrp: 'input[name="list_price"]',
    sellingPrice: 'input[name="standard_price"]',
    hsnCode: 'input[name="hsn_code"]',
    skuId: 'input[name="item_sku"]',
    quantity: 'input[name="quantity"]',
    searchKeywords: 'textarea[name="generic_keywords"]',
    submit: "",
  },
};
