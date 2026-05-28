import { z } from 'zod';

/**
 * Schémas de validation Zod par catégorie d'objet.
 * À ajuster avec ITEM_VALIDATION_SCHEMAS_V1.docx une fois lu.
 */

const baseItemSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(120),
  brand: z.string().min(1, 'Marque requise').max(80),
  model: z.string().max(120).optional(),
  serial_number: z.string().max(80).optional(),
  purchase_date: z.string().optional(), // ISO date
  purchase_price: z.number().nonnegative().optional(),
  purchase_currency: z.enum(['EUR', 'USD', 'GBP', 'CHF']).default('EUR'),
  condition: z.enum(['mint', 'excellent', 'good', 'fair', 'poor']).default('excellent'),
  is_authenticated: z.boolean().default(false),
});

export const handbagSchema = baseItemSchema.extend({
  category: z.literal('handbag'),
  metadata: z
    .object({
      material: z.string().optional(),
      color: z.string().optional(),
      size: z.string().optional(),
      hardware_color: z.enum(['gold', 'silver', 'rose_gold', 'black', 'other']).optional(),
    })
    .default({}),
});

export const sneakerSchema = baseItemSchema.extend({
  category: z.literal('sneaker'),
  metadata: z
    .object({
      size_eu: z.number().min(20).max(60).optional(),
      colorway: z.string().optional(),
      release_year: z.number().int().min(1900).max(2100).optional(),
    })
    .default({}),
});

export const watchSchema = baseItemSchema.extend({
  category: z.literal('watch'),
  metadata: z
    .object({
      movement: z.enum(['automatic', 'quartz', 'manual', 'other']).optional(),
      case_size_mm: z.number().min(20).max(60).optional(),
      reference: z.string().optional(),
      year: z.number().int().min(1900).max(2100).optional(),
    })
    .default({}),
});

export const jewelrySchema = baseItemSchema.extend({
  category: z.literal('jewelry'),
  metadata: z
    .object({
      material:  z.string().optional(),
      stone:     z.string().optional(),
      metal:     z.enum(['gold', 'white_gold', 'rose_gold', 'silver', 'platinum', 'other']).optional(),
      weight_g:  z.number().positive().optional(),
    })
    .default({}),
});

export const otherSchema = baseItemSchema.extend({
  category: z.literal('other'),
  metadata: z.record(z.unknown()).default({}),
});

export const itemSchema = z.discriminatedUnion('category', [
  handbagSchema,
  sneakerSchema,
  watchSchema,
  jewelrySchema,
  otherSchema,
]);

export type ItemFormValues = z.infer<typeof itemSchema>;
