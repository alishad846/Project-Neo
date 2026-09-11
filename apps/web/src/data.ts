// The data behind the "live compile" demo. It is a faithful, static mirror of
// the real Product Genome -> Marketplace Adapter mapping: one canonical record
// on the left, three marketplace-shaped listings on the right. The point of the
// section is to show that the seller is currently the human translator between
// these shapes, and that Neo compiles the translation instead.

export interface GenomeField {
  label: string;
  value: string;
}

export interface Genome {
  id: string;
  name: string;
  sku: string;
  hero: string; // short tagline shown under the name
  fields: GenomeField[];
}

export interface CompiledField {
  key: string; // the marketplace's own field name
  value: string;
  note?: string; // why it differs — the translation Neo performs
}

export interface AdapterOutput {
  marketplace: "Meesho" | "Amazon India" | "Flipkart";
  transport: "Supplier Panel" | "SP-API" | "Seller API v3";
  fields: CompiledField[];
}

export interface Product {
  genome: Genome;
  outputs: AdapterOutput[];
}

export const PRODUCTS: Product[] = [
  {
    genome: {
      id: "kurti",
      name: "Printed Cotton Kurti",
      sku: "KURTI-001",
      hero: "Round-neck · three-quarter sleeve · casual",
      fields: [
        { label: "category", value: "Women › Kurtis" },
        { label: "fabric", value: "Cotton" },
        { label: "colour", value: "Indigo Blue" },
        { label: "neck", value: "Round" },
        { label: "sleeve", value: "Three-Quarter" },
        { label: "HSN", value: "6204" },
        { label: "cost", value: "₹250" },
        { label: "price", value: "₹699" },
      ],
    },
    outputs: [
      {
        marketplace: "Meesho",
        transport: "Supplier Panel",
        fields: [
          { key: "Neck Type", value: "Round Neck" },
          { key: "Sleeve Length", value: "Three-Quarter Sleeve" },
          { key: "Fabric", value: "Cotton" },
          { key: "Product Name", value: "Indigo Printed Cotton Kurti for Women" },
          { key: "Price", value: "₹699" },
        ],
      },
      {
        marketplace: "Amazon India",
        transport: "SP-API",
        fields: [
          { key: "neck_style", value: "Crew Neck", note: "Amazon's vocabulary, not Meesho's" },
          { key: "sleeve_type", value: "3/4 Sleeve" },
          { key: "bullet_point1", value: "Breathable pure-cotton kurti for daily wear" },
          { key: "generic_keywords", value: "cotton kurti indigo round neck three quarter" },
          { key: "standard_price", value: "699.00" },
        ],
      },
      {
        marketplace: "Flipkart",
        transport: "Seller API v3",
        fields: [
          { key: "Neck", value: "Round", note: "Same product, a third spelling" },
          { key: "Sleeve", value: "3/4th Sleeve" },
          { key: "Ideal For", value: "Women" },
          { key: "title", value: "Indigo Cotton Round-Neck Kurti" },
          { key: "selling_price", value: "699" },
        ],
      },
    ],
  },
  {
    genome: {
      id: "saree",
      name: "Banarasi Silk Saree",
      sku: "SAREE-014",
      hero: "6.3m · with blouse piece · festive",
      fields: [
        { label: "category", value: "Women › Sarees" },
        { label: "fabric", value: "Art Silk" },
        { label: "colour", value: "Maroon" },
        { label: "length", value: "6.3 m" },
        { label: "blouse", value: "Included" },
        { label: "HSN", value: "5407" },
        { label: "cost", value: "₹640" },
        { label: "price", value: "₹1,499" },
      ],
    },
    outputs: [
      {
        marketplace: "Meesho",
        transport: "Supplier Panel",
        fields: [
          { key: "Saree Fabric", value: "Art Silk" },
          { key: "Blouse Piece", value: "Yes" },
          { key: "Saree Length", value: "6.3 metres" },
          { key: "Product Name", value: "Maroon Banarasi Art Silk Festive Saree" },
          { key: "Price", value: "₹1499" },
        ],
      },
      {
        marketplace: "Amazon India",
        transport: "SP-API",
        fields: [
          { key: "material_type", value: "Art Silk" },
          { key: "included_components", value: "Saree, Unstitched Blouse Piece", note: "Amazon wants components enumerated" },
          { key: "bullet_point1", value: "Festive Banarasi weave with matching blouse piece" },
          { key: "generic_keywords", value: "banarasi saree maroon art silk festive wedding" },
          { key: "standard_price", value: "1499.00" },
        ],
      },
      {
        marketplace: "Flipkart",
        transport: "Seller API v3",
        fields: [
          { key: "Fabric", value: "Art Silk" },
          { key: "Blouse Piece", value: "Yes" },
          { key: "Saree Length", value: "6.3" },
          { key: "title", value: "Maroon Banarasi Art Silk Saree with Blouse Piece" },
          { key: "selling_price", value: "1499" },
        ],
      },
    ],
  },
];

// Data for the reversible Price Manager demo — a dry-run diff exactly like the
// one the extension shows before it touches a live catalogue.
export interface PriceRow {
  sku: string;
  name: string;
  oldPrice: number;
  costPrice: number; // product manufacturing cost per unit
}

export const PRICE_RULES = [
  "Drop price 10% on everything in Kurtis",
  "Match lowest competitor, floor at break-even",
  "Round all prices to ₹__99",
] as const;

export const PRICE_ROWS: PriceRow[] = [
  { sku: "KURTI-001", name: "Printed Cotton Kurti", oldPrice: 699, costPrice: 450 },
  { sku: "KURTI-007", name: "Rayon A-Line Kurti", oldPrice: 549, costPrice: 325 },
  { sku: "TOP-003", name: "Cotton Crop Top", oldPrice: 349, costPrice: 175 },
  { sku: "DRESS-011", name: "Floral Midi Dress", oldPrice: 899, costPrice: 540 },
  { sku: "LEG-002", name: "Ankle-Length Leggings", oldPrice: 299, costPrice: 165 },
  { sku: "SAREE-014", name: "Banarasi Art Silk Saree", oldPrice: 1499, costPrice: 930 },
  { sku: "KURTI-032", name: "Anarkali Flared Kurti", oldPrice: 1199, costPrice: 710 },
  { sku: "DUP-021", name: "Chiffon Printed Dupatta", oldPrice: 399, costPrice: 210 },
  { sku: "TOP-018", name: "Ribbed Knit Tank Top", oldPrice: 299, costPrice: 160 },
  { sku: "NGT-004", name: "Cotton Nightwear Set", oldPrice: 649, costPrice: 390 },
  { sku: "ACC-010", name: "Silicone Phone Grip", oldPrice: 10, costPrice: 8 },
  { sku: "ACC-100", name: "Cotton Handkerchief", oldPrice: 100, costPrice: 35 },
  { sku: "ACC-150", name: "Beaded Hair Clip Set", oldPrice: 150, costPrice: 55 },
];
