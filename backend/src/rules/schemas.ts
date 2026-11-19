import { z } from 'zod';

/**
 * Schémas de validation par catégorie — ITEM_VALIDATION_SCHEMAS_V1 + ITEM_FORM_DEFINITION,
 * arbitrés par les décisions P1 (nominatif non bloquant), P2, P3 (modèle requis : sneakers seulement),
 * P15 (prix d'acquisition obligatoire).
 */

export const CATEGORIES = ['watch', 'handbag', 'sneaker', 'certified_other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const UNIQUE_ID_TYPES = {
  watch: 'serial_number',
  handbag: 'auth_code',
  sneaker: 'sneaker_composite',
} as const;

export const CERTIFICATE_TYPES = ['card', 'certificate', 'invoice', 'marketplace', 'third_party'] as const;
export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'] as const;
export const DOCUMENT_TYPES = ['insurance', 'invoice', 'maintenance', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const DELETION_REASONS = ['lost', 'stolen', 'sold', 'given', 'destroyed', 'other'] as const;

const nonEmpty = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'format AAAA-MM-JJ attendu')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'date invalide');

const acquisitionPrice = z.object({
  amount: z.number().nonnegative().max(1e10),
  currency: z.enum(CURRENCIES),
});

const common = {
  id: z.string().uuid(), // identifiant du brouillon, devient l'id de l'objet (décision T2)
  brand: nonEmpty(80),
  acquisition_price: acquisitionPrice,
  acquisition_date: isoDate.optional(),
  issuer_id: nonEmpty(40), // source du certificat, liste contrôlée
  certificate_type: z.enum(CERTIFICATE_TYPES),
  certificate_external_id: optionalText(120),
  cover_photo_upload_key: optionalText(300),
  declaration_accepted: z.literal(true), // « En confirmant, vous déclarez être le propriétaire… »
};

export const watchSchema = z.object({
  ...common,
  category: z.literal('watch'),
  model: optionalText(120),
  reference_code: optionalText(80),
  serial_number: nonEmpty(120),
});

export const handbagSchema = z.object({
  ...common,
  category: z.literal('handbag'),
  model: optionalText(120),
  reference_code: optionalText(80),
  auth_code: nonEmpty(120),
});

export const sneakerSchema = z
  .object({
    ...common,
    category: z.literal('sneaker'),
    model: nonEmpty(120),
    reference_code: optionalText(80),
    sku: nonEmpty(60),
    size: nonEmpty(20),
    order_id: optionalText(120),
  })
  .refine((v) => Boolean(v.order_id || v.certificate_external_id), {
    message: 'numéro de commande ou identifiant du certificat requis',
    path: ['order_id'],
  });

export const certifiedOtherSchema = z.object({
  ...common,
  category: z.literal('certified_other'),
  controlled_other_type_id: nonEmpty(60),
  model: nonEmpty(120), // désignation
  reference_code: optionalText(80),
  unique_id_value: nonEmpty(120),
});

export const createItemSchema = z.union([watchSchema, handbagSchema, sneakerSchema, certifiedOtherSchema]);
export type CreateItemInput = z.infer<typeof createItemSchema>;

export const deleteItemSchema = z
  .object({
    reason: z.enum(DELETION_REASONS),
    free_text: optionalText(500),
  })
  .refine((v) => v.reason !== 'other' || Boolean(v.free_text), {
    message: 'précision requise pour « autre »',
    path: ['free_text'],
  });

export const putMeSchema = z.object({ full_name: z.string().trim().min(2).max(120) });

export const uploadUrlSchema = z.object({
  content_type: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  size_bytes: z.number().int().positive().max(20 * 1024 * 1024),
});

export const photoUploadUrlSchema = z.object({
  content_type: z.enum(['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  size_bytes: z.number().int().positive().max(15 * 1024 * 1024),
});

export const confirmDocumentSchema = z.object({
  upload_key: nonEmpty(300),
  type: z.enum(DOCUMENT_TYPES),
});

/** Extrait le couple (type, valeur brute) d'identifiant unique selon la catégorie. */
export function rawUniqueId(input: CreateItemInput): { type: string; parts: string[] } {
  switch (input.category) {
    case 'watch':
      return { type: UNIQUE_ID_TYPES.watch, parts: [input.serial_number] };
    case 'handbag':
      return { type: UNIQUE_ID_TYPES.handbag, parts: [input.auth_code] };
    case 'sneaker':
      return {
        type: UNIQUE_ID_TYPES.sneaker,
        parts: [input.sku, input.size, (input.order_id ?? input.certificate_external_id)!],
      };
    case 'certified_other':
      return { type: `other:${input.controlled_other_type_id}`, parts: [input.unique_id_value] };
  }
}
