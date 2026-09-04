export interface MeeshoSelectorMap {
  title: string;
  description: string;
  hsnCode: string;
  sellingPrice: string;
  submit: string;
}

export type MeeshoConfigId = "fixture" | "live";

// A selector map is DATA, not code (brief §5.3): the content script's fill
// sequence is fixed; only these targets vary per environment. An empty string
// means "this field is not present on this step" and is skipped silently by the
// filler (vs. a real selector that fails to match, which is reported missing).
export const SELECTOR_CONFIGS: Record<MeeshoConfigId, MeeshoSelectorMap> = {
  fixture: {
    title: "#title",
    description: "#description",
    hsnCode: "#hsnCode",
    sellingPrice: "#sellingPrice",
    submit: "#submit",
  },
  // LIVE — real selectors from the Meesho Supplier Panel "Add Product" (single
  // catalog) step 1. Meesho is a React + MUI app with randomized Emotion class
  // names, so we target the STABLE `name` attributes on the text fields.
  //   Product Name        -> textarea[name="product_name"]
  //   Product Description -> textarea[name="comment"]
  // HSN, selling price, and the attribute dropdowns live on LATER wizard steps
  // (Basic/Additional Details), not on step 1 — left "" until those steps' DOM
  // is captured. Step 1's "Next" button has no stable id, so submit-focus is
  // skipped ("") and the seller advances the wizard themselves.
  live: {
    title: 'textarea[name="product_name"]',
    description: 'textarea[name="comment"]',
    hsnCode: "",
    sellingPrice: "",
    submit: "",
  },
};
