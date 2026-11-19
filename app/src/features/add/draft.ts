import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import type { Schemas } from '@/api/client';
import type { PickedFile } from '@/api/upload';

export type Category = Schemas['Category'];
export type Method = 'manual' | 'qr' | 'photo';

/**
 * Brouillon d'ajout, en mémoire uniquement : abandonner le flow ne persiste rien côté app
 * (Page ajouter un objet §9). Côté serveur, le brouillon est purgé après 24 h.
 */
export interface AddDraft {
  draftId: string;
  method: Method | null;
  category: Category | null;
  fields: Record<string, string>;
  scannedId: string | null;
  certificate: { file: PickedFile; confirmation: Schemas['CertificateConfirmation'] } | null;
  photo: { file: PickedFile; uploadKey: string } | null;
  set: (p: Partial<Omit<AddDraft, 'set' | 'setField' | 'reset'>>) => void;
  setField: (k: string, v: string) => void;
  reset: () => void;
}

const fresh = () => ({
  draftId: Crypto.randomUUID(),
  method: null,
  category: null,
  fields: { currency: 'EUR' } as Record<string, string>,
  scannedId: null,
  certificate: null,
  photo: null,
});

export const useAddDraft = create<AddDraft>((set) => ({
  ...fresh(),
  set: (p) => set(p),
  setField: (k, v) => set((s) => ({ fields: { ...s.fields, [k]: v } })),
  reset: () => set(fresh()),
}));

/** Champ qui reçoit l'identifiant unique selon la catégorie (QR, décision P7). */
export function uniqueIdField(category: Category | null): string {
  switch (category) {
    case 'watch': return 'serial_number';
    case 'handbag': return 'auth_code';
    case 'sneaker': return 'sku';
    default: return 'unique_id_value';
  }
}

/** Construit le corps de POST /items et liste les champs obligatoires manquants. */
export function buildCreateItem(d: Pick<AddDraft, 'draftId' | 'category' | 'fields' | 'photo'>): {
  body: Schemas['CreateItem'] | null;
  missing: string[];
} {
  const f = d.fields;
  const req = (k: string) => (f[k] ?? '').trim();
  const missing: string[] = [];
  const need = (keys: string[]) => keys.forEach((k) => { if (!req(k)) missing.push(k); });

  need(['brand', 'price', 'currency', 'issuer_id', 'certificate_type']);
  switch (d.category) {
    case 'watch': need(['serial_number']); break;
    case 'handbag': need(['auth_code']); break;
    case 'sneaker':
      need(['model', 'sku', 'size']);
      if (!req('order_id') && !req('certificate_external_id')) missing.push('order_id');
      break;
    case 'certified_other': need(['controlled_other_type_id', 'model', 'unique_id_value']); break;
    default: missing.push('category');
  }
  const amount = Number(req('price').replace(',', '.'));
  if (req('price') && (!Number.isFinite(amount) || amount < 0)) missing.push('price');
  if (req('acquisition_date') && !/^\d{4}-\d{2}-\d{2}$/.test(req('acquisition_date'))) missing.push('acquisition_date');
  if (missing.length || !d.category) return { body: null, missing };

  const opt = (k: string) => req(k) || undefined;
  const body = {
    id: d.draftId,
    category: d.category,
    brand: req('brand'),
    model: opt('model'),
    reference_code: opt('reference_code'),
    serial_number: opt('serial_number'),
    auth_code: opt('auth_code'),
    sku: opt('sku'),
    size: opt('size'),
    order_id: opt('order_id'),
    controlled_other_type_id: opt('controlled_other_type_id'),
    unique_id_value: opt('unique_id_value'),
    acquisition_price: { amount, currency: req('currency') as Schemas['Currency'] },
    acquisition_date: opt('acquisition_date'),
    issuer_id: req('issuer_id'),
    certificate_type: req('certificate_type') as Schemas['CreateItem']['certificate_type'],
    certificate_external_id: opt('certificate_external_id'),
    cover_photo_upload_key: d.photo?.uploadKey,
    declaration_accepted: true,
  } as Schemas['CreateItem'];
  return { body, missing };
}
