import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/database';
import { productGenome, productGenomeHistory } from '../db/schema';

@Injectable()
export class ProductsService {
  async createProduct(data: typeof productGenome.$inferInsert) {
    const result = await db
      .insert(productGenome)
      .values({ ...data, basePrice: data.basePrice ?? data.sellingPrice ?? null })
      .returning();

    return result[0];
  }
  async getAllProducts(sellerId?: string) {
    const filters = [eq(productGenome.isArchived, false)];
    if (sellerId) filters.push(eq(productGenome.sellerId, sellerId));
    return db.select().from(productGenome).where(and(...filters));
  }

  async getProductById(id: number, sellerId?: string) {
    const filters = [eq(productGenome.id, id), eq(productGenome.isArchived, false)];
    if (sellerId) filters.push(eq(productGenome.sellerId, sellerId));
    const result = await db.select().from(productGenome).where(and(...filters));
    const product = result[0];
    if (!product) throw new NotFoundException(`Product ${id} was not found`);
    return product;
  }

  async getSellerPriors(sellerId: string, category?: string) {
    try {
      const products = await db
        .select()
        .from(productGenome)
        .where(
          and(
            eq(productGenome.sellerId, sellerId),
            eq(productGenome.isArchived, false),
          ),
        );

      const categoryProducts = category
        ? products.filter((product) => product.category?.toLowerCase() === category.toLowerCase())
        : products;
      const relevant = categoryProducts.length > 0 ? categoryProducts : products;
      if (relevant.length === 0) return undefined;

      const fabrics = new Set<string>();
      const colors = new Set<string>();
      const patterns = new Set<string>();
      const neckTypes = new Set<string>();
      const sleeveLengths = new Set<string>();

      for (const product of relevant) {
        if (product.fabric) fabrics.add(product.fabric);
        if (product.colour) colors.add(product.colour);
        const attrs = product.attributes as Record<string, unknown> | null;
        if (!attrs) continue;
        if (typeof attrs.fabric === "string") fabrics.add(attrs.fabric);
        if (typeof attrs.color === "string") colors.add(attrs.color);
        if (typeof attrs.colour === "string") colors.add(attrs.colour);
        if (typeof attrs.pattern === "string") patterns.add(attrs.pattern);
        if (typeof attrs.neckType === "string") neckTypes.add(attrs.neckType);
        if (typeof attrs.sleeveLength === "string") sleeveLengths.add(attrs.sleeveLength);
      }

      return {
        frequentFabrics: [...fabrics],
        frequentColors: [...colors],
        frequentPatterns: [...patterns],
        frequentNeckTypes: [...neckTypes],
        frequentSleeveLengths: [...sleeveLengths],
      };
    } catch {
      // A prior is an optional hint; extraction must still work if the lookup fails.
      return undefined;
    }
  }

async updateProduct(
    id: number,
    data: Partial<typeof productGenome.$inferInsert>,
    sellerId?: string,
  ) {
  return db.transaction(async (tx) => {
    // 1. Get current product
    const existing = await tx
      .select()
      .from(productGenome)
      .where(
        sellerId
          ? and(eq(productGenome.id, id), eq(productGenome.sellerId, sellerId))
          : eq(productGenome.id, id),
      );

    const current = existing[0];

    if (!current) throw new NotFoundException(`Product ${id} was not found`);

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
      basePrice: current.basePrice,
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
async getProductHistory(id: number, sellerId?: string) {
    const product = await this.findProductForOwner(id, sellerId);
    if (!product) throw new NotFoundException(`Product ${id} was not found`);
    const filters = [eq(productGenomeHistory.productId, id)];
    if (sellerId) filters.push(eq(productGenomeHistory.sellerId, sellerId));
    return db
    .select()
    .from(productGenomeHistory)
    .where(and(...filters));
}
async rollbackProduct(id: number, targetVersion: number, sellerId?: string) {
  return db.transaction(async (tx) => {
    // Current product
    const currentResult = await tx
      .select()
      .from(productGenome)
      .where(
        sellerId
          ? and(eq(productGenome.id, id), eq(productGenome.sellerId, sellerId))
          : eq(productGenome.id, id),
      );

    const current = currentResult[0];

    if (!current) throw new NotFoundException(`Product ${id} was not found`);

    // Version we want to restore
    const historyResult = await tx
      .select()
      .from(productGenomeHistory)
      .where(
        sellerId
          ? and(
              eq(productGenomeHistory.productId, id),
              eq(productGenomeHistory.version, targetVersion),
              eq(productGenomeHistory.sellerId, sellerId),
            )
          : and(
              eq(productGenomeHistory.productId, id),
              eq(productGenomeHistory.version, targetVersion),
            ),
      );

    const target = historyResult[0];

    if (!target) throw new NotFoundException(`Version ${targetVersion} was not found for product ${id}`);

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
      basePrice: current.basePrice,
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
        basePrice: target.basePrice,
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
async archiveProduct(id: number, sellerId?: string) {
  const filters = [eq(productGenome.id, id)];
  if (sellerId) filters.push(eq(productGenome.sellerId, sellerId));
  const existing = await db
    .select()
    .from(productGenome)
    .where(and(...filters));

  const current = existing[0];

  if (!current) {
    throw new NotFoundException(`Product ${id} was not found`);
  }

  const archived = await db
    .update(productGenome)
    .set({
      isArchived: true,
      updatedAt: new Date(),
    })
    .where(and(...filters))
    .returning();

  return archived[0];
}
async restoreProduct(id: number, sellerId?: string) {
  const filters = [eq(productGenome.id, id)];
  if (sellerId) filters.push(eq(productGenome.sellerId, sellerId));
  const restored = await db
    .update(productGenome)
    .set({
      isArchived: false,
      updatedAt: new Date(),
    })
    .where(and(...filters))
    .returning();

  if (!restored[0]) throw new NotFoundException(`Product ${id} was not found`);
  return restored[0];
  }

  private async findProductForOwner(id: number, sellerId?: string) {
    const filters = [eq(productGenome.id, id)];
    if (sellerId) filters.push(eq(productGenome.sellerId, sellerId));
    const result = await db.select({ id: productGenome.id }).from(productGenome).where(and(...filters));
    return result[0];
  }
}
