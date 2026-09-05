import type { ProductGenome } from "@neo/genome";
import type { CompiledListing } from "@neo/adapter";

interface GenomeAttributes {
  description?: string;
  keywords?: string[];
  pattern?: string;
  occasion?: string;
  neckType?: string;
  sleeveLength?: string;
  sareeLength?: string;
  blousePiece?: boolean;
  mrp?: string | number;
  wrong_defective_returns_price?: string | number;
  gst_percent?: string | number;
  inventory?: number | string;
  style_code?: string;
  group_id?: string;
  sku_id?: string;
  image_1?: string;
}

function readAttributes(genome: ProductGenome): GenomeAttributes {
  return (genome.attributes ?? {}) as GenomeAttributes;
}

export function compile(genome: ProductGenome, categoryId: string): CompiledListing {
  const attrs = readAttributes(genome);
  const sizes = Array.isArray(genome.sizes) ? genome.sizes : [];

  return {
    adapterId: "meesho",
    categoryId,
    genomeVersion: genome.version,
    fields: {
      product_name: genome.title ?? "",
      productName: genome.title ?? "",
      title: genome.title ?? "",
      variation: sizes,
      meesho_price: genome.sellingPrice ?? "0",
      wrong_defective_returns_price: attrs.wrong_defective_returns_price ?? "",
      sellingPrice: genome.sellingPrice ?? "0",
      mrp: attrs.mrp ?? "",
      gst_percent: attrs.gst_percent ?? "",
      hsn_id: genome.hsnCode ?? "",
      net_weight_gms: genome.weight ?? "",
      inventory: attrs.inventory ?? "",
      image_1: attrs.image_1 ?? (Array.isArray(genome.images) ? genome.images[0] ?? "" : ""),
      style_code: attrs.style_code ?? "",
      sku_id: attrs.sku_id ?? genome.sku,
      group_id: attrs.group_id ?? String(genome.id),
      brand_name: genome.brand ?? "",
      description: attrs.description ?? "",
      keywords: attrs.keywords ?? [],
      category: genome.category ?? categoryId,
      colour: genome.colour ?? "",
      fabric: genome.fabric ?? "",
      sizes,
      hsnCode: genome.hsnCode ?? "",
images: Array.isArray(genome.images) ? genome.images : [],
      pattern: attrs.pattern,
      occasion: attrs.occasion,
      neckType: attrs.neckType,
      sleeveLength: attrs.sleeveLength,
      sareeLength: attrs.sareeLength,
      blousePiece: attrs.blousePiece,
    },
  };
}