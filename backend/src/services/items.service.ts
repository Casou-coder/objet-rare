import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import type { DataSource } from 'typeorm';
import { AppError } from '../common/errors';
import { CONFIG, type AppConfig } from '../config';
import { DATA_SOURCE, type Tx } from '../db/database';
import { OCR_PROVIDER, type OcrProvider } from '../providers/providers';
import { scoreReadability } from '../readability/readability';
import { holderMatch, normalizeUniqueId } from '../rules/normalize';
import { deriveProofStatus, documentStatus, type ProofInput } from '../rules/proof-status';
import { CATEGORIES, rawUniqueId, type Category, type CreateItemInput } from '../rules/schemas';
import { STORAGE, type Storage } from '../storage/storage';
import { UsersService, type UserRow } from './users.service';

interface DraftRow {
  id: string;
  user_id: string;
  certificate_key: string | null;
  certificate_hash: string | null;
  certificate_mime: string | null;
  readability_score: number | null;
  holder_name_detected: string | null;
  ocr_fields: Record<string, string> | null;
  photo_key: string | null;
  created_at: Date;
}

export interface ItemRow {
  id: string;
  user_id: string;
  category: Category;
  controlled_other_type_id: string | null;
  brand: string;
  model: string | null;
  reference_code: string | null;
  attributes: Record<string, string>;
  unique_id_type: string;
  unique_id_value: string;
  acquisition_amount: string;
  acquisition_currency: string;
  acquisition_date: string | null;
  cover_photo_key: string | null;
  created_at: Date;
  updated_at: Date;
}

const PG_UNIQUE_VIOLATION = '23505';
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');

@Injectable()
export class ItemsService {
  private readonly logger = new Logger('Items');

  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(OCR_PROVIDER) private readonly ocr: OcrProvider,
    @Inject(CONFIG) private readonly config: AppConfig,
    private readonly users: UsersService,
  ) {}

  // ───────────────────────── limites ─────────────────────────

  private async assertCanAddItem(q: Tx | DataSource, user: UserRow): Promise<void> {
    if (user.plan === 'premium') return;
    const [{ n }] = await q.query('select count(*)::int as n from items where user_id = $1', [user.id]);
    if (n >= this.config.freeItemLimit) throw new AppError('FREE_LIMIT_REACHED');
  }

  // ───────────────────────── brouillons (T2) ─────────────────────────

  private async itemExists(id: string): Promise<{ user_id: string } | null> {
    const rows = await this.ds.query('select user_id from items where id = $1', [id]);
    return rows[0] ?? null;
  }

  /** Renvoie le brouillon de l'utilisateur, le crée si besoin. Ne révèle jamais l'existence d'un autre brouillon. */
  private async draftFor(user: UserRow, id: string, create: boolean): Promise<DraftRow> {
    const existingItem = await this.itemExists(id);
    if (existingItem) {
      // Certificat non remplaçable tant que l'objet existe (BUSINESS_RULES §3.1, décision P5)
      if (existingItem.user_id === user.id) throw new AppError('FORBIDDEN');
      throw new AppError('NOT_FOUND');
    }
    const rows: DraftRow[] = await this.ds.query('select * from item_drafts where id = $1', [id]);
    if (rows[0]) {
      if (rows[0].user_id !== user.id) throw new AppError('NOT_FOUND');
      return rows[0];
    }
    if (!create) throw new AppError('NOT_FOUND');
    const inserted: DraftRow[] = await this.ds.query(
      'insert into item_drafts (id, user_id) values ($1, $2) on conflict (id) do nothing returning *',
      [id, user.id],
    );
    if (!inserted[0]) throw new AppError('NOT_FOUND');
    return inserted[0];
  }

  async certificateUploadUrl(user: UserRow, id: string, contentType: string) {
    this.users.requireProfile(user);
    const draft = await this.draftFor(user, id, true);
    await this.assertCanAddItem(this.ds, user);
    if (draft.certificate_key) await this.storage.deleteMany([draft.certificate_key]);
    const key = `users/${user.id}/drafts/${id}/certificate-${randomUUID()}`;
    await this.ds.query(
      `update item_drafts set certificate_key = $2, certificate_mime = $3, certificate_hash = null,
       readability_score = null, holder_name_detected = null, ocr_fields = null where id = $1`,
      [id, key, contentType],
    );
    return this.uploadTicket(key, contentType);
  }

  async photoUploadUrl(user: UserRow, id: string, contentType: string) {
    this.users.requireProfile(user);
    const draft = await this.draftFor(user, id, true);
    if (draft.photo_key) await this.storage.deleteMany([draft.photo_key]);
    const key = `users/${user.id}/drafts/${id}/photo-${randomUUID()}`;
    await this.ds.query('update item_drafts set photo_key = $2 where id = $1', [id, key]);
    return this.uploadTicket(key, contentType);
  }

  async uploadTicket(key: string, contentType: string) {
    const ttl = this.config.signedUrlTtlSeconds;
    return {
      upload_url: await this.storage.presignPut(key, contentType, ttl),
      upload_key: key,
      method: 'PUT' as const,
      headers: { 'Content-Type': contentType },
      expires_in: ttl,
    };
  }

  /**
   * Confirme le certificat téléversé : empreinte calculée côté serveur (T5), anti-doublon global,
   * score de lisibilité (seuil 65), puis OCR (préremplissage, décision P6).
   */
  async certificateConfirm(user: UserRow, id: string, category: Category | null) {
    this.users.requireProfile(user);
    const draft = await this.draftFor(user, id, false);
    if (!draft.certificate_key) throw new AppError('VALIDATION_ERROR', [{ field: 'certificate', issue: 'aucun fichier téléversé' }]);
    const obj = await this.storage.get(draft.certificate_key);
    if (!obj) throw new AppError('VALIDATION_ERROR', [{ field: 'certificate', issue: 'aucun fichier téléversé' }]);
    const reject = async (code: 'DUPLICATE_CERTIFICATE' | 'CERTIFICATE_NOT_READABLE' | 'VALIDATION_ERROR', details?: unknown) => {
      await this.storage.deleteMany([draft.certificate_key!]);
      await this.ds.query(
        'update item_drafts set certificate_key = null, certificate_hash = null, readability_score = null where id = $1',
        [id],
      );
      throw new AppError(code, details);
    };
    if (obj.body.length > MAX_UPLOAD_BYTES) await reject('VALIDATION_ERROR', [{ field: 'certificate', issue: 'fichier trop volumineux' }]);

    const hash = sha256(obj.body);
    const dup = await this.ds.query('select 1 from file_hashes where hash = $1', [hash]);
    if (dup.length) await reject('DUPLICATE_CERTIFICATE');

    const mime = draft.certificate_mime ?? obj.contentType;
    const { score } = await scoreReadability(obj.body, mime);
    if (score < this.config.readabilityThreshold) {
      await reject('CERTIFICATE_NOT_READABLE', { readability_score: score, options: ['rescan', 'manual_entry'] });
    }

    // OCR uniquement si lisible (OCR_EXTRACTION_CONTRACTS : « Score < 65 → OCR non lancé »)
    let extraction: Record<string, string> = {};
    try {
      extraction = (await this.ocr.extract(obj.body, mime, category)) as Record<string, string>;
    } catch {
      extraction = {}; // l'OCR a le droit d'échouer
    }
    const holder = extraction.holder_name ?? null;
    await this.ds.query(
      `update item_drafts set certificate_hash = $2, readability_score = $3, holder_name_detected = $4, ocr_fields = $5
       where id = $1`,
      [id, hash, score, holder, JSON.stringify(extraction)],
    );
    const { holder_name: _omit, ...fields } = extraction;
    return {
      readability_score: score,
      readable: true,
      holder_name_detected: Boolean(holder),
      holder_match: holderMatch(holder, user.full_name),
      extraction: fields,
    };
  }

  // ───────────────────────── création ─────────────────────────

  async create(user: UserRow, input: CreateItemInput) {
    this.users.requireProfile(user);
    const draftRows: DraftRow[] = await this.ds.query('select * from item_drafts where id = $1', [input.id]);
    const draft = draftRows[0];
    if (!draft || draft.user_id !== user.id) {
      if (await this.itemExists(input.id)) throw new AppError('FORBIDDEN');
      throw new AppError('VALIDATION_ERROR', [{ field: 'certificate', issue: 'certificat requis' }]);
    }
    if (!draft.certificate_hash || draft.readability_score === null || !draft.certificate_key) {
      throw new AppError('VALIDATION_ERROR', [{ field: 'certificate', issue: 'certificat requis' }]);
    }
    if (draft.readability_score < this.config.readabilityThreshold) throw new AppError('CERTIFICATE_NOT_READABLE');

    const issuer = await this.ds.query('select 1 from certificate_issuers where id = $1', [input.issuer_id]);
    if (!issuer.length) throw new AppError('VALIDATION_ERROR', [{ field: 'issuer_id', issue: 'source inconnue' }]);
    if (input.category === 'certified_other') {
      const t = await this.ds.query('select 1 from controlled_other_types where id = $1 and active', [input.controlled_other_type_id]);
      if (!t.length) throw new AppError('VALIDATION_ERROR', [{ field: 'controlled_other_type_id', issue: 'type non activé' }]);
    }
    let photoKey: string | null = null;
    if (input.cover_photo_upload_key) {
      if (input.cover_photo_upload_key !== draft.photo_key || !(await this.storage.get(draft.photo_key))) {
        throw new AppError('VALIDATION_ERROR', [{ field: 'cover_photo_upload_key', issue: 'photo introuvable' }]);
      }
      photoKey = draft.photo_key;
    }

    const uid = rawUniqueId(input);
    const normalized = normalizeUniqueId(uid.parts);
    const attributes: Record<string, string> = {};
    if (input.category === 'sneaker') {
      attributes.sku = input.sku;
      attributes.size = input.size;
      if (input.order_id) attributes.order_id = input.order_id;
    }
    const displayValue = uid.parts.join(' · ');

    let conflictWith: string | null = null;
    try {
      await this.ds.transaction(async (tx) => {
        const locked = await this.users.lock(tx, user.id);
        await this.assertCanAddItem(tx, locked);

        const dup = await tx.query('select 1 from file_hashes where hash = $1', [draft.certificate_hash]);
        if (dup.length) throw new AppError('DUPLICATE_CERTIFICATE');

        const existing = await tx.query(
          'select id from items where unique_id_type = $1 and unique_id_normalized = $2',
          [uid.type, normalized],
        );
        if (existing.length) {
          conflictWith = existing[0].id;
          throw new AppError('UNIQUE_ID_CONFLICT');
        }

        await tx.query(
          `insert into items (id, user_id, category, controlled_other_type_id, brand, model, reference_code, attributes,
             unique_id_type, unique_id_value, unique_id_normalized, acquisition_amount, acquisition_currency,
             acquisition_date, cover_photo_key)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            input.id, user.id, input.category,
            input.category === 'certified_other' ? input.controlled_other_type_id : null,
            input.brand, input.model ?? null, input.reference_code ?? null, JSON.stringify(attributes),
            uid.type, displayValue, normalized, input.acquisition_price.amount, input.acquisition_price.currency,
            input.acquisition_date ?? null, photoKey,
          ],
        );
        await tx.query(
          `insert into certificates (item_id, file_hash, storage_key, mime_type, issuer_id, certificate_type, external_id,
             readability_score, holder_name_detected, holder_match)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            input.id, draft.certificate_hash, draft.certificate_key, draft.certificate_mime ?? 'application/octet-stream',
            input.issuer_id, input.certificate_type, input.certificate_external_id ?? null, draft.readability_score,
            draft.holder_name_detected, holderMatch(draft.holder_name_detected, locked.full_name),
          ],
        );
        await tx.query('insert into file_hashes (hash, item_id) values ($1, $2)', [draft.certificate_hash, input.id]);
        await tx.query('insert into market_values (item_id) values ($1)', [input.id]);
        await tx.query('delete from item_drafts where id = $1', [input.id]);
      });
    } catch (e) {
      const pg = e as { code?: string; constraint?: string; driverError?: { code?: string; constraint?: string } };
      const code = pg.code ?? pg.driverError?.code;
      const constraint = pg.constraint ?? pg.driverError?.constraint;
      if (code === PG_UNIQUE_VIOLATION && constraint === 'items_unique_id') {
        const ex = await this.ds.query('select id from items where unique_id_type = $1 and unique_id_normalized = $2', [uid.type, normalized]);
        conflictWith = ex[0]?.id ?? null;
        e = new AppError('UNIQUE_ID_CONFLICT');
      } else if (code === PG_UNIQUE_VIOLATION && constraint === 'file_hashes_pkey') {
        e = new AppError('DUPLICATE_CERTIFICATE');
      }
      if (e instanceof AppError && e.code === 'UNIQUE_ID_CONFLICT') {
        // Enregistré hors transaction : le conflit persiste alors que la création est refusée (BUSINESS_RULES §5.2).
        // Notification aux utilisateurs reportée (décision P10).
        await this.ds.query(
          `insert into conflicts (unique_id_type, unique_id_value, existing_item_id, attempt_user_id, attempt_payload)
           values ($1,$2,$3,$4,$5)`,
          [uid.type, normalized, conflictWith, user.id, JSON.stringify({ category: input.category, brand: input.brand, model: input.model ?? null })],
        );
        this.logger.warn('Conflit d’unicité enregistré');
      }
      throw e;
    }
    return this.get(user, input.id);
  }

  // ───────────────────────── lecture ─────────────────────────

  async owned(user: UserRow, id: string): Promise<ItemRow> {
    const rows: ItemRow[] = await this.ds.query('select * from items where id = $1 and user_id = $2', [id, user.id]);
    if (!rows[0]) throw new AppError('NOT_FOUND');
    return rows[0];
  }

  private proofInput(row: {
    readability_score: number | null;
    holder_name_detected: string | null;
    holder_match: 'match' | 'mismatch' | 'unknown' | null;
    has_conflict: boolean;
    has_certificate: boolean;
  }): ProofInput {
    return {
      hasCertificate: row.has_certificate,
      readabilityScore: row.readability_score,
      threshold: this.config.readabilityThreshold,
      holderNameDetected: row.holder_name_detected,
      holderMatch: row.holder_match ?? 'unknown',
      hasUniqueId: true,
      // Décision P10 : aucun statut de conflit visible chez le premier propriétaire en V1.
      hasOpenConflict: false,
    };
  }

  displayName(i: Pick<ItemRow, 'brand' | 'model' | 'reference_code'>): string {
    return [i.brand, i.model ?? i.reference_code].filter(Boolean).join(' ');
  }

  private async photoUrl(key: string | null): Promise<string | null> {
    return key ? this.storage.presignGet(key, this.config.signedUrlTtlSeconds) : null;
  }

  async list(user: UserRow, view: 'collection' | 'vault', sort: 'recent' | 'oldest') {
    const order = view === 'vault' ? 'i.updated_at desc' : sort === 'oldest' ? 'i.created_at asc' : 'i.created_at desc';
    const rows = await this.ds.query(
      `select i.*, c.readability_score, c.holder_name_detected, c.holder_match, (c.id is not null) as has_certificate,
              false as has_conflict, mv.value_amount, mv.currency as value_currency, mv.as_of as value_as_of
       from items i
       left join certificates c on c.item_id = i.id
       left join market_values mv on mv.item_id = i.id
       where i.user_id = $1 order by ${order}`,
      [user.id],
    );
    return Promise.all(
      rows.map(async (r: ItemRow & Record<string, unknown>) => {
        const base = {
          id: r.id,
          name: this.displayName(r),
          primary_image_url: await this.photoUrl(r.cover_photo_key),
          created_at: r.created_at,
        };
        // Ma collection : aucune autre donnée (Page ma collection §3)
        if (view === 'collection') return base;
        return {
          ...base,
          category: r.category,
          updated_at: r.updated_at,
          indicative_market_value: r.value_amount === null ? null : Number(r.value_amount),
          currency: r.value_currency ?? null,
          value_as_of: r.value_as_of ?? null,
          document_status: documentStatus(this.proofInput(r as never)),
        };
      }),
    );
  }

  async get(user: UserRow, id: string) {
    const item = await this.owned(user, id);
    const [c] = await this.ds.query('select * from certificates where item_id = $1', [id]);
    const [mv] = await this.ds.query('select * from market_values where item_id = $1', [id]);
    const [{ n }] = await this.ds.query('select count(*)::int as n from documents where item_id = $1', [id]);
    const proof = this.proofInput({
      readability_score: c?.readability_score ?? null,
      holder_name_detected: c?.holder_name_detected ?? null,
      holder_match: c?.holder_match ?? null,
      has_certificate: Boolean(c),
      has_conflict: false,
    });
    return {
      id: item.id,
      category: item.category,
      controlled_other_type_id: item.controlled_other_type_id,
      brand: item.brand,
      model: item.model,
      reference_code: item.reference_code,
      name: this.displayName(item),
      attributes: item.attributes,
      unique_id: { type: item.unique_id_type, value: item.unique_id_value },
      acquisition_price: { amount: Number(item.acquisition_amount), currency: item.acquisition_currency },
      acquisition_date: item.acquisition_date,
      primary_image_url: await this.photoUrl(item.cover_photo_key),
      proof_status: deriveProofStatus(proof),
      document_status: documentStatus(proof),
      certificate: c
        ? {
            id: c.id,
            issuer_id: c.issuer_id,
            certificate_type: c.certificate_type,
            external_id: c.external_id,
            uploaded_at: c.uploaded_at,
            readability_status: c.readability_score >= this.config.readabilityThreshold ? 'readable' : 'unreadable',
          }
        : null,
      value: {
        indicative_market_value: mv?.value_amount === null || mv?.value_amount === undefined ? null : Number(mv.value_amount),
        currency: mv?.currency ?? null,
        as_of: mv?.as_of ?? null,
        status: mv?.status ?? 'idle',
      },
      documents_count: n,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  // ───────────────────────── modification / suppression ─────────────────────────

  async patch(user: UserRow, id: string): Promise<never> {
    await this.owned(user, id);
    // Décision P5 : rien n'est modifiable après la création.
    throw new AppError('FORBIDDEN', { reason: 'ITEM_IMMUTABLE' });
  }

  /** Clés de stockage d'un ensemble d'objets (certificats, documents, photos). */
  async storageKeysForItems(q: Tx | DataSource, itemIds: string[]): Promise<string[]> {
    if (!itemIds.length) return [];
    const rows: { k: string | null }[] = await q.query(
      `select storage_key as k from certificates where item_id = any($1)
       union all select storage_key from documents where item_id = any($1)
       union all select cover_photo_key from items where id = any($1)`,
      [itemIds],
    );
    return rows.map((r) => r.k).filter((k): k is string => Boolean(k));
  }

  /** Suppression immédiate et totale (CONTRAT §10.1) : fichiers, objet, certificat, documents, historique. */
  async delete(user: UserRow, id: string, reason: string, freeText?: string): Promise<void> {
    await this.owned(user, id);
    const keys = await this.storageKeysForItems(this.ds, [id]);
    await this.storage.deleteMany(keys);
    await this.ds.transaction(async (tx) => {
      await tx.query('insert into deletion_logs (user_id, item_id, reason, free_text) values ($1,$2,$3,$4)', [
        user.id, id, reason, reason === 'other' ? freeText ?? null : null,
      ]);
      await tx.query('delete from conflicts where existing_item_id = $1', [id]);
      await tx.query('delete from items where id = $1', [id]); // cascade : certificat, documents, empreintes, valeurs
    });
  }

  /** Purge des brouillons abandonnés (> 24 h) et de leurs fichiers. */
  async purgeStaleDrafts(): Promise<number> {
    const rows: { certificate_key: string | null; photo_key: string | null }[] = await this.ds.query(
      `delete from item_drafts where created_at < now() - ($1 || ' hours')::interval returning certificate_key, photo_key`,
      [String(this.config.draftTtlHours)],
    );
    await this.storage.deleteMany(rows.flatMap((r) => [r.certificate_key, r.photo_key]).filter((k): k is string => Boolean(k)));
    return rows.length;
  }

  static isCategory(v: unknown): v is Category {
    return typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);
  }
}
