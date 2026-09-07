import type { ProductGenome } from "@neo/genome";
import type { CompiledListing } from "@neo/adapter";

export interface GenomeAttributes {
  description?: string;
  keywords?: string[];
  bulletPoints?: string[];
}

export function compile(genome: ProductGenome, categoryId: string): CompiledListing {
  const attrs = (genome.attributes as GenomeAttributes) ?? {};
  const bulletPoints = attrs.bulletPoints ?? [];

  return {
    adapterId: "amazon_in",
    categoryId,
    genomeVersion: genome.version,
    fields: {
      productName: genome.title ?? "",
      description: attrs.description ?? "",
      brandName: genome.brand ?? "",
      bulletPoint1: bulletPoints[0] ?? "",
      bulletPoint2: bulletPoints[1] ?? "",
      bulletPoint3: bulletPoints[2] ?? "",
      searchKeywords: (attrs.keywords ?? []).join(", "),
      sellingPrice: genome.sellingPrice,
      mrp: genome.costPrice ?? genome.sellingPrice,
      hsnCode: genome.hsnCode ?? "",
      skuId: "",
      colour: genome.colour ?? "",
      fabric: genome.fabric ?? "",
      sizes: genome.sizes ?? [],
      images: genome.images ?? [],
    },
  };
}
