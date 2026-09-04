// Seller "business details" — the legal/mandatory fields Meesho requires that
// are the SAME for every product a seller lists (manufacturer/packer/importer
// info, country of origin, default net weight, brand). Entered once, stored in
// the browser, and merged into every live autofill.
//
// Keys are Meesho's own field `name` attributes so the values drop straight into
// the generic name-based filler with no remapping.

export interface BusinessDetails {
  manufacturer_name: string;
  manufacturer_address: string;
  manufacturer_pincode: string;
  packer_name: string;
  packer_address: string;
  packer_pincode: string;
  importer_name: string;
  importer_address: string;
  importer_pincode: string;
  country_of_origin: string;
  product_weight_in_gms: string;
  brand: string;
}

export const EMPTY_BUSINESS_DETAILS: BusinessDetails = {
  manufacturer_name: "",
  manufacturer_address: "",
  manufacturer_pincode: "",
  packer_name: "",
  packer_address: "",
  packer_pincode: "",
  importer_name: "",
  importer_address: "",
  importer_pincode: "",
  country_of_origin: "India",
  product_weight_in_gms: "",
  brand: "",
};

// Field groups drive the form layout and keep labels in one place.
export const BUSINESS_FIELD_GROUPS: Array<{
  title: string;
  fields: Array<{ key: keyof BusinessDetails; label: string; placeholder?: string }>;
}> = [
  {
    title: "Manufacturer",
    fields: [
      { key: "manufacturer_name", label: "Name" },
      { key: "manufacturer_address", label: "Address" },
      { key: "manufacturer_pincode", label: "Pincode" },
    ],
  },
  {
    title: "Packer",
    fields: [
      { key: "packer_name", label: "Name" },
      { key: "packer_address", label: "Address" },
      { key: "packer_pincode", label: "Pincode" },
    ],
  },
  {
    title: "Importer",
    fields: [
      { key: "importer_name", label: "Name" },
      { key: "importer_address", label: "Address" },
      { key: "importer_pincode", label: "Pincode" },
    ],
  },
  {
    title: "Defaults",
    fields: [
      { key: "country_of_origin", label: "Country of Origin" },
      { key: "product_weight_in_gms", label: "Net Weight (gms)" },
      { key: "brand", label: "Brand" },
    ],
  },
];

const STORAGE_KEY = "neo_business_details";

const chromeApi = (globalThis as { chrome?: any }).chrome;

function hasChromeStorage(): boolean {
  return Boolean(chromeApi?.storage?.local);
}

export async function getBusinessDetails(): Promise<BusinessDetails> {
  let raw: string | null = null;
  if (hasChromeStorage()) {
    const result = await chromeApi.storage.local.get(STORAGE_KEY);
    const value = result?.[STORAGE_KEY];
    raw = typeof value === "string" ? value : null;
  } else {
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      raw = null;
    }
  }
  if (!raw) return { ...EMPTY_BUSINESS_DETAILS };
  try {
    // Merge over defaults so newly-added fields are always present.
    return { ...EMPTY_BUSINESS_DETAILS, ...(JSON.parse(raw) as Partial<BusinessDetails>) };
  } catch {
    return { ...EMPTY_BUSINESS_DETAILS };
  }
}

export async function saveBusinessDetails(details: BusinessDetails): Promise<void> {
  const raw = JSON.stringify(details);
  if (hasChromeStorage()) {
    await chromeApi.storage.local.set({ [STORAGE_KEY]: raw });
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // storage unavailable — nothing more we can do
  }
}

// Only the non-empty fields, for merging into the autofill name-map.
export function businessDetailsToFields(details: BusinessDetails): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(details)) {
    if (v && v.trim()) out[k] = v.trim();
  }
  return out;
}
