import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
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
  return db
    .select()
    .from(productGenome)
    .where(eq(productGenome.isArchived, false));
}
  async getProductById(id: number) {
  const result = await db
    .select()
    .from(productGenome)
    .where(
      and(
        eq(productGenome.id, id),
        eq(productGenome.isArchived, false),
      ),
    );

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
}
async rollbackProduct(id: number, targetVersion: number) {
  return db.transaction(async (tx) => {
    // Current product
    const currentResult = await tx
      .select()
      .from(productGenome)
      .where(eq(productGenome.id, id));

    const current = currentResult[0];

    if (!current) {
      return null;
    }

    // Version we want to restore
    const historyResult = await tx
      .select()
      .from(productGenomeHistory)
      .where(
        and(
          eq(productGenomeHistory.productId, id),
          eq(productGenomeHistory.version, targetVersion),
        ),
      );

    const target = historyResult[0];

    if (!target) {
      return null;
    }

    // Save current state before rollback
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

    // Restore old values as a NEW version
    const restored = await tx
      .update(productGenome)
      .set({
        sellerId: target.sellerId,
        sku: target.sku,
        title: target.title,
        brand: target.brand,
        category: target.category,
        colour: target.colour,
        fabric: target.fabric,
        sizes: target.sizes,
        weight: target.weight,
        dimensions: target.dimensions,
        hsnCode: target.hsnCode,
        costPrice: target.costPrice,
        sellingPrice: target.sellingPrice,
        images: target.images,
        attributes: target.attributes,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(productGenome.id, id))
      .returning();

    return restored[0];
  });
}
async archiveProduct(id: number) {
  const existing = await db
    .select()
    .from(productGenome)
    .where(eq(productGenome.id, id));

  const current = existing[0];

  if (!current) {
    return null;
  }

  const archived = await db
    .update(productGenome)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(eq(productGenome.id, id))
    .returning();

  return archived[0];
}
async restoreProduct(id: number) {
  const restored = await db
    .update(productGenome)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(eq(productGenome.id, id))
    .returning();

  return restored[0] ?? null;
}}