/**
 * Types TypeScript du schéma Supabase.
 * Ce fichier sera regénéré automatiquement via `supabase gen types typescript`
 * une fois ton projet Supabase créé. En attendant, voici les types prévus.
 */

export type ItemCategory = 'handbag' | 'sneaker' | 'watch' | 'jewelry' | 'other';
export type ItemCondition = 'mint' | 'excellent' | 'good' | 'fair' | 'poor';
export type DocumentType = 'invoice' | 'certificate' | 'warranty' | 'other';
export type OcrStatus = 'pending' | 'done' | 'failed';
export type Plan = 'free' | 'premium';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  premium_expires_at: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  owner_id: string;
  category: ItemCategory;
  brand: string;
  model: string | null;
  name: string;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  purchase_currency: string | null;
  condition: ItemCondition;
  is_authenticated: boolean;
  metadata: Record<string, unknown>;
  cover_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemPhoto {
  id: string;
  item_id: string;
  url: string;
  position: number;
  is_cover: boolean;
}

export interface DocumentRow {
  id: string;
  owner_id: string;
  item_id: string | null;
  type: DocumentType;
  storage_path: string;
  filename: string;
  ocr_status: OcrStatus;
  ocr_data: Record<string, unknown> | null;
  expires_at: string | null; // ISO date — warranty expiry; NULL for non-warranty docs
  created_at: string;
}

// Supabase migration (run once in SQL editor):
// ALTER TABLE public.documents ADD COLUMN expires_at date;

export interface Certificate {
  id: string;
  item_id: string;
  category: ItemCategory;
  payload: Record<string, unknown>;
  pdf_url: string | null;
  issued_at: string;
}
