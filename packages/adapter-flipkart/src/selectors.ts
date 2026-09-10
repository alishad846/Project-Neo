export interface FlipkartSelectorMap {
  productName: string;
  description: string;
  brand: string;
  mrp: string;
  sellingPrice: string;
  hsnCode: string;
  skuId: string;
  procurementSla: string;
  stockCount: string;
  shippingDays: string;
  submit: string;
}

export type FlipkartConfigId = "fixture" | "live";

/**
 * Flipkart Seller Hub uses an Angular/React hybrid.
 * Many fields use name attributes but some rely on data-testid or label-proximity selectors.
 * The live config targets the most stable attributes found.
 * Some fields like procurement SLA and stock are on secondary sections and may not be visible
 * on initial page load (left empty = skipped).
 */
export const SELECTOR_CONFIGS: Record<FlipkartConfigId, FlipkartSelectorMap> = {
  fixture: {
    productName: "#productName",
    description: "#description",
    brand: "#brand",
    mrp: "#mrp",
    sellingPrice: "#sellingPrice",
    hsnCode: "#hsnCode",
    skuId: "#skuId",
    procurementSla: "#procurementSla",
    stockCount: "#stockCount",
    shippingDays: "#shippingDays",
    submit: "#submit"
  },
  live: {
    productName: 'input[name="product_name"]',
    description: 'textarea[name="description"]',
    brand: 'input[name="brand"]',
    mrp: 'input[name="mrp"]',
    sellingPrice: 'input[name="selling_price"]',
    hsnCode: 'input[name="hsn"]',
    skuId: 'input[name="sku_id"]',
    procurementSla: 'input[name="procurement_sla"]',
    stockCount: 'input[name="stock"]',
    shippingDays: 'input[name="shipping_days"]',
    submit: ""
  }
};
