import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/database';
import { productGenome, productGenomeHistory } from '../db/schema';

@Injectable()
export class ProductsService {
  async createProduct(data: typeof productGenome.$inferInsert) {
    const result = await db
      .insert(productGenome)
      .values(data)
      .returning();

    return result[0];
  }
  async getAllProducts() {
    return db.select().from(productGenome);
  }
  async getProductById(id: number) {
  const result = await db
    .select()
    .from(productGenome)
    .where(eq(productGenome.id, id));

  return result[0];
}

async updateProduct(
  id: number,
  data: Partial<typeof productGenome.$inferInsert>,
) {
  return db.transaction(async (tx) => {
    // 1. Get current product
    const existing = await tx
      .select()
      .from(productGenome)
      .where(eq(productGenome.id, id));

    const current = existing[0];

    if (!current) {
      return null;
    }

    // 2. Save current version into history
    await tx.insert(productGenomeHistory).values({
      productId: current.id,
      sellerId: current.sellerId,
      sku: current.sku,
      title: current.title,
      brand: current.brand,
      category: current.category,
      colour: current.colour,
      fabric: current.fabric,
      sizes: current.sizes,
      weight: current.weight,
      dimensions: current.dimensions,
      hsnCode: current.hsnCode,
      costPrice: current.costPrice,
      sellingPrice: current.sellingPrice,
      images: current.images,
      attributes: current.attributes,
      version: current.version,
    });

    // 3. Update current product and increment version
    const updated = await tx
      .update(productGenome)
      .set({
        ...data,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(productGenome.id, id))
      .returning();

    return updated[0];
  });
}
async getProductHistory(id: number) {
  return db
    .select()
    .from(productGenomeHistory)
    .where(eq(productGenomeHistory.productId, id));
}}