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
}

function readAttributes(genome: ProductGenome): GenomeAttributes {
  return (genome.attributes ?? {}) as GenomeAttributes;
}

export function compile(genome: ProductGenome, categoryId: string): CompiledListing {
  const attrs = readAttributes(genome);
  return {
    adapterId: "meesho",
    categoryId,
    genomeVersion: genome.version,
    fields: {
      title: genome.title ?? "",
      description: attrs.description ?? "",
      keywords: attrs.keywords ?? [],
      category: genome.category ?? categoryId,
      colour: genome.colour ?? "",
      fabric: genome.fabric ?? "",
      sizes: genome.sizes ?? [],
      hsnCode: genome.hsnCode ?? "",
      sellingPrice: genome.sellingPrice ?? "0",
      images: genome.images ?? [],
      pattern: attrs.pattern,
      occasion: attrs.occasion,
      neckType: attrs.neckType,
      sleeveLength: attrs.sleeveLength,
      sareeLength: attrs.sareeLength,
      blousePiece: attrs.blousePiece,
    },
  };
}
