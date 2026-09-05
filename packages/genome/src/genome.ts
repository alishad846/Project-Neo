import { z } from "zod";

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => String(v))
  .nullable()
  .optional();

export const productGenomeInsertSchema = z.object({
  sellerId: z.string().min(1),
  sku: z.string().min(1),
  title: z.string().max(255).nullable().optional(),
  brand: z.string().max(150).nullable().optional(),
  category: z.string().max(150).nullable().optional(),
  colour: z.string().max(100).nullable().optional(),
  fabric: z.string().max(100).nullable().optional(),
  sizes: z.unknown().optional(),
  weight: decimalString,
  dimensions: z.unknown().optional(),
  hsnCode: z.string().max(50).nullable().optional(),
  costPrice: decimalString,
  sellingPrice: decimalString,
  images: z.unknown().optional(),
  attributes: z.unknown().optional(),
});

export const productGenomeSchema = productGenomeInsertSchema.extend({
  id: z.number().int(),
  version: z.number().int(),
  isArchived: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export const productGenomeUpdateSchema =
  productGenomeInsertSchema.partial();

export type ProductGenomeInsert = z.infer<typeof productGenomeInsertSchema>;
export type ProductGenomeUpdate = z.infer<typeof productGenomeUpdateSchema>;
export type ProductGenome = z.infer<typeof productGenomeSchema>;
