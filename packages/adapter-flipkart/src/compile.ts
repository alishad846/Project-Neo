import type { ProductGenome } from "@neo/genome";
import type { CompiledListing } from "@neo/adapter";

export interface GenomeAttributes {
  description?: string;
  keywords?: string[];
  procurementSla?: number;
  shippingDays?: number;
}

export function compile(genome: ProductGenome, categoryId: string): CompiledListing {
  const attrs = (genome.attributes as GenomeAttributes) || {};

  return {
    adapterId: "flipkart",
    categoryId,
    genomeVersion: genome.version,
    fields: {
      productName: genome.title ?? "",
      description: attrs.description ?? "",
      brand: genome.brand ?? "",
      mrp: genome.costPrice ?? 0,
      sellingPrice: genome.sellingPrice ?? 0,
      hsnCode: genome.hsnCode ?? "",
      skuId: "",
      colour: genome.colour ?? "",
      fabric: genome.fabric ?? "",
      sizes: genome.sizes ?? [],
      images: genome.images ?? [],
      procurementSla: attrs.procurementSla !== undefined ? String(attrs.procurementSla) : "3",
      shippingDays: attrs.shippingDays !== undefined ? String(attrs.shippingDays) : "",
      stockCount: ""
    }
  };
}
