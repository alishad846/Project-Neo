import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { db } from "../db/database";
import { transactions } from "../db/schema";
import { ProductsService } from "../products/products.service";

export interface PriceSnapshotEntry {
  productId: number;
  previousPrice: string;
}

export interface GenomeSnapshotEntry {
  productId: number;
  previous: {
    title: string | null;
    attributes: unknown;
    hsnCode?: string | null;
    sellingPrice?: string | null;
  };
}

@Injectable()
export class TransactionsService {
  constructor(private readonly products: ProductsService) {}

  async createPriceTxn(snapshot: PriceSnapshotEntry[], diff: unknown, sellerId: string,) {
    const rows = await db
      .insert(transactions)
      .values({ sellerId,kind: "price", snapshot, diff, result: "success" })
      .returning();
    return { id: rows[0].id };
  }

  async getTxn(id: number, sellerId: string) {
    const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.sellerId, sellerId),
      ),
    );
    return rows[0] ?? null;
  }

  async rollbackPriceTxn(id: number, sellerId: string) {
    const txn = await this.getTxn(id, sellerId);
    if (!txn) return { restored: 0 };
    if (txn.kind !== "price") return { restored: 0 };
    const snapshot = txn.snapshot as PriceSnapshotEntry[];
    let restored = 0;
    for (const entry of snapshot) {
      await this.products.updateProduct(
        entry.productId,
        { sellingPrice: entry.previousPrice },
        sellerId,
      );
      restored += 1;
    }
    return { restored };
  }

  async createGenomeTxn(snapshot: GenomeSnapshotEntry[], diff: unknown, sellerId: string,) {
    const rows = await db
      .insert(transactions)
      .values({ sellerId, kind: "genome", snapshot, diff, result: "success" })
      .returning();
    return { id: rows[0].id };
  }

  async rollbackGenomeTxn(id: number, sellerId: string) {
    const txn = await this.getTxn(id, sellerId);
    if (!txn) return { restored: 0 };
    if (txn.kind !== "genome") return { restored: 0 };
    const snapshot = txn.snapshot as GenomeSnapshotEntry[];
    let restored = 0;
    for (const entry of snapshot) {
      await this.products.updateProduct(entry.productId, entry.previous, sellerId,);
      restored += 1;
    }
    return { restored };
  }
}
