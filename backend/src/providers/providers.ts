/**
 * Points d'extension non branchés (fournisseurs à choisir) :
 * - OCR (OCR_EXTRACTION_CONTRACTS_V1) : propose des valeurs, ne valide rien.
 * - Valeur de marché : indicative, datée, nullable.
 */
import type { Category } from '../rules/schemas';

export const OCR_PROVIDER = Symbol('OCR_PROVIDER');
export const MARKET_PROVIDER = Symbol('MARKET_PROVIDER');

export interface OcrExtraction {
  holder_name?: string;
  brand?: string;
  model?: string;
  reference_code?: string;
  serial_number?: string;
  auth_code?: string;
  sku?: string;
  size?: string;
  order_id?: string;
  acquisition_date?: string;
}

export interface OcrProvider {
  extract(file: Buffer, contentType: string, category: Category | null): Promise<OcrExtraction>;
}

/** Aucun fournisseur : la saisie manuelle est un chemin normal. */
export class NoopOcrProvider implements OcrProvider {
  async extract(): Promise<OcrExtraction> {
    return {};
  }
}

export interface MarketQuote {
  amount: number | null;
  currency: string;
  confidence: 'low' | 'medium' | 'high';
  sources: string[];
  as_of: Date;
}

export interface MarketProvider {
  quote(item: { category: string; brand: string; model: string | null; reference_code: string | null }): Promise<MarketQuote | null>;
}

/** Aucun fournisseur : « Valeur indisponible », sans erreur. */
export class NoopMarketProvider implements MarketProvider {
  async quote(): Promise<MarketQuote | null> {
    return null;
  }
}
