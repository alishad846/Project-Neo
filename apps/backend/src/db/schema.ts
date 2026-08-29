import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  jsonb,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const productGenome = pgTable('product_genome', {
  id: serial('id').primaryKey(),

  sellerId: varchar('seller_id', { length: 100 }).notNull(),

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
});
export const productGenomeHistory = pgTable('product_genome_history', {
  id: serial('id').primaryKey(),

  productId: integer('product_id').notNull(),

  sellerId: varchar('seller_id', { length: 100 }).notNull(),

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
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  adapterId: varchar('adapter_id', { length: 50 }).notNull().default('internal'),
  kind: varchar('kind', { length: 50 }).notNull(),
  snapshot: jsonb('snapshot').notNull(),
  diff: jsonb('diff'),
  result: varchar('result', { length: 20 }).notNull().default('success'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});