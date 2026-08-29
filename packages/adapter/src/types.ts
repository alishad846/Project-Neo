import type { ProductGenome } from "@neo/genome";

export type MarketplaceId = "meesho" | "amazon_in" | "flipkart";
export type TxnResult = "success" | "partial" | "failed";

export interface Txn {
  id: string;
  adapterId: MarketplaceId;
  createdAt: string;
  snapshot: unknown;
  diff: unknown;
  result: TxnResult;
}

export interface ValidationIssue {
  field: string;
  severity: "error" | "warning";
  message: string;
}

export interface CompiledListing {
  adapterId: MarketplaceId;
  categoryId: string;
  genomeVersion: number;
  fields: Record<string, unknown>;
}

export interface PriceChange { sku: string; newPrice: number; }
export interface StockChange { sku: string; newStock: number; }

export interface MarketplaceAdapter {
  readonly id: MarketplaceId;
  readonly transport: "api" | "panel";
  compile(genome: ProductGenome, categoryId: string): CompiledListing;
  validate(listing: CompiledListing): ValidationIssue[];
  publish(listing: CompiledListing): Promise<Txn>;
  updatePrice(changes: PriceChange[]): Promise<Txn>;
  updateInventory(changes: StockChange[]): Promise<Txn>;
  rollback(txn: Txn): Promise<void>;
}
