import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db } from "../db/database";
import { transactions } from "../db/schema";
import { ProductsService } from "../products/products.service";

export interface PriceSnapshotEntry {
  productId: number;
  previousPrice: string;
}

@Injectable()
export class TransactionsService {
  constructor(private readonly products: ProductsService) {}

  async createPriceTxn(snapshot: PriceSnapshotEntry[], diff?: unknown) {
    const rows = await db
      .insert(transactions)
      .values({ kind: "price", snapshot, diff, result: "success" })
      .returning();
    return { id: rows[0].id };
  }

  async getTxn(id: number) {
    const rows = await db.select().from(transactions).where(eq(transactions.id, id));
    return rows[0] ?? null;
  }

  async rollbackPriceTxn(id: number) {
    const txn = await this.getTxn(id);
    if (!txn) return { restored: 0 };
    if (txn.kind !== "price") return { restored: 0 };
    const snapshot = txn.snapshot as PriceSnapshotEntry[];
    let restored = 0;
    for (const entry of snapshot) {
      await this.products.updateProduct(entry.productId, { sellingPrice: entry.previousPrice });
      restored += 1;
    }
    return { restored };
  }
}
