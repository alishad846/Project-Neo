export interface MeeshoSelectorMap {
  title: string;
  description: string;
  hsnCode: string;
  sellingPrice: string;
  submit: string;
}

export type MeeshoConfigId = "fixture" | "live";

export const SELECTOR_CONFIGS: Record<MeeshoConfigId, MeeshoSelectorMap> = {
  fixture: {
    title: "#title",
    description: "#description",
    hsnCode: "#hsnCode",
    sellingPrice: "#sellingPrice",
    submit: "#submit",
  },
  // LIVE: placeholder selectors — replaced with real ones when the user supplies
  // the logged-in Meesho Add-Product page DOM. This is intentional external-input
  // data (documented scaffold), NOT an unfinished code path.
  live: {
    title: "TODO_LIVE_title_selector",
    description: "TODO_LIVE_description_selector",
    hsnCode: "TODO_LIVE_hsn_selector",
    sellingPrice: "TODO_LIVE_price_selector",
    submit: "TODO_LIVE_submit_selector",
  },
};
