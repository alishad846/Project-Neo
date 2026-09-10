import {
  pgTable,
  serial,
  varchar,
  integer,
  decimal,
  jsonb,
  timestamp,
  boolean,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

// Seller account is the parent entity for seller-owned data.
export const sellers = pgTable('sellers', {
  id: varchar('id', { length: 64 }).primaryKey(),

  email: varchar('email', { length: 255 }).notNull().unique(),

  passwordHash: varchar('password_hash', { length: 255 }).notNull(),

  fullName: varchar('full_name', { length: 150 }),

  shopName: varchar('shop_name', { length: 150 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productGenome = pgTable(
  'product_genome', 
  {
  id: serial('id').primaryKey(),

  // FK: ensures every product belongs to a valid seller.
  sellerId: varchar('seller_id', { length: 64 }).notNull().references(() => sellers.id),

  sku: varchar('sku', { length: 100 }).notNull(),

  title: varchar('title', { length: 255 }),

  brand: varchar('brand', { length: 150 }),

  category: varchar('category', { length: 150 }),

  colour: varchar('colour', { length: 100 }),

  fabric: varchar('fabric', { length: 100 }),

  sizes: jsonb('sizes'),

  weight: decimal('weight', { precision: 10, scale: 2 }),

  dimensions: jsonb('dimensions'),

  hsnCode: varchar('hsn_code', { length: 50 }),

  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),

  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),

  images: jsonb('images'),

  attributes: jsonb('attributes'),

  version: integer('version').default(1).notNull(),

  isArchived: boolean('is_archived').default(false).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),

  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    // Prevents duplicate SKUs for the same seller.
    unique('product_genome_seller_sku_unique').on(
      table.sellerId,
      table.sku,
    ),

    // Speeds up seller-specific product queries.
    index('product_genome_seller_id_idx').on(table.sellerId),

    // Prevents invalid version and price/weight values.
    check('product_genome_version_check', sql`${table.version} >= 1`),
    check('product_genome_weight_check', sql`${table.weight} IS NULL OR ${table.weight} >= 0`),
    check('product_genome_cost_price_check', sql`${table.costPrice} IS NULL OR ${table.costPrice} >= 0`),
    check('product_genome_selling_price_check', sql`${table.sellingPrice} IS NULL OR ${table.sellingPrice} >= 0`),
  ],
);


export const productGenomeHistory = pgTable(
  'product_genome_history', 
  {
  id: serial('id').primaryKey(),

  // FK: keeps every history record linked to an existing product.
  productId: integer('product_id').notNull().references(() => productGenome.id),

  // FK: ensures historical product data belongs to a valid seller.
  sellerId: varchar('seller_id', { length: 64 }).notNull().references(() => sellers.id),

  sku: varchar('sku', { length: 100 }).notNull(),

  title: varchar('title', { length: 255 }),

  brand: varchar('brand', { length: 150 }),

  category: varchar('category', { length: 150 }),

  colour: varchar('colour', { length: 100 }),

  fabric: varchar('fabric', { length: 100 }),

  sizes: jsonb('sizes'),

  weight: decimal('weight', { precision: 10, scale: 2 }),

  dimensions: jsonb('dimensions'),

  hsnCode: varchar('hsn_code', { length: 50 }),

  costPrice: decimal('cost_price', { precision: 10, scale: 2 }),

  sellingPrice: decimal('selling_price', { precision: 10, scale: 2 }),

  images: jsonb('images'),

  attributes: jsonb('attributes'),

  version: integer('version').notNull(),

  archivedAt: timestamp('archived_at').defaultNow().notNull(),
  },
  (table) => [
    // Speeds up history/version lookup during rollback.
    index('product_genome_history_product_version_idx').on(
      table.productId,
      table.version,
    ),

    // Prevents invalid version and price/weight values.
    check('product_genome_history_version_check', sql`${table.version} >= 1`),
    check('product_genome_history_weight_check', sql`${table.weight} IS NULL OR ${table.weight} >= 0`),
    check('product_genome_history_cost_price_check', sql`${table.costPrice} IS NULL OR ${table.costPrice} >= 0`),
    check('product_genome_history_selling_price_check', sql`${table.sellingPrice} IS NULL OR ${table.sellingPrice} >= 0`),
  ],
);

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  sellerId: varchar('seller_id', { length: 64 }).notNull().references(() => sellers.id),
  adapterId: varchar('adapter_id', { length: 50 }).notNull().default('internal'),
  kind: varchar('kind', { length: 50 }).notNull(),
  snapshot: jsonb('snapshot').notNull(),
  diff: jsonb('diff'),
  result: varchar('result', { length: 20 }).notNull().default('success'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
},
(table) => [
    // Speeds up seller-scoped transaction lookups.
    index('transactions_seller_id_idx').on(table.sellerId),
  ],
);