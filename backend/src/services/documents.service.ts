import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { DataSource } from 'typeorm';
import { AppError } from '../common/errors';
import { CONFIG, type AppConfig } from '../config';
import { DATA_SOURCE } from '../db/database';
import type { DocumentType } from '../rules/schemas';
import { STORAGE, type Storage } from '../storage/storage';
import { ItemsService, sha256 } from './items.service';
import { UsersService, type UserRow } from './users.service';

const DUPLICATE_DOCUMENT_MESSAGE = 'Ce document est déjà associé à un objet existant.'; // CONTRAT §5.2

interface DocRow {
  id: string;
  item_id: string;
  type: DocumentType;
  storage_key: string;
  mime_type: string;
  uploaded_at: Date;
}

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(CONFIG) private readonly config: AppConfig,
    private readonly items: ItemsService,
    private readonly users: UsersService,
  ) {}

  private prefix(user: UserRow, itemId: string) {
    return `users/${user.id}/items/${itemId}/documents/`;
  }

  /** Free (décision P4) : uniquement 1 assurance par objet, aucun autre document. */
  private async assertDocumentAllowed(q: { query: DataSource['query'] }, user: UserRow, itemId: string, type: DocumentType) {
    if (user.plan === 'premium') return;
    if (type !== 'insurance') throw new AppError('FREE_LIMIT_REACHED', { reason: 'DOCUMENT_TYPE_PREMIUM' });
    const [{ n }] = await q.query(
      "select count(*)::int as n from documents where item_id = $1 and type = 'insurance'",
      [itemId],
    );
    if (n >= this.config.freeInsurancePerItem) throw new AppError('FREE_LIMIT_REACHED', { reason: 'INSURANCE_LIMIT' });
  }

  async uploadUrl(user: UserRow, itemId: string, contentType: string, type?: DocumentType) {
    await this.items.owned(user, itemId);
    if (type) await this.assertDocumentAllowed(this.ds, user, itemId, type);
    const key = `${this.prefix(user, itemId)}${randomUUID()}`;
    return this.items.uploadTicket(key, contentType);
  }

  async confirm(user: UserRow, itemId: string, uploadKey: string, type: DocumentType) {
    await this.items.owned(user, itemId);
    if (!uploadKey.startsWith(this.prefix(user, itemId)) || uploadKey.includes('..')) {
      throw new AppError('VALIDATION_ERROR', [{ field: 'upload_key', issue: 'clé invalide' }]);
    }
    const obj = await this.storage.get(uploadKey);
    if (!obj) throw new AppError('VALIDATION_ERROR', [{ field: 'upload_key', issue: 'aucun fichier téléversé' }]);
    const hash = sha256(obj.body);
    try {
      await this.ds.transaction(async (tx) => {
        const locked = await this.users.lock(tx, user.id);
        await this.assertDocumentAllowed(tx, locked, itemId, type);
        const dup = await tx.query('select 1 from file_hashes where hash = $1', [hash]);
        if (dup.length) throw new AppError('DUPLICATE_CERTIFICATE', undefined, DUPLICATE_DOCUMENT_MESSAGE);
        await tx.query('insert into file_hashes (hash, item_id) values ($1, $2)', [hash, itemId]);
        await tx.query(
          'insert into documents (item_id, type, file_hash, storage_key, mime_type) values ($1,$2,$3,$4,$5)',
          [itemId, type, hash, uploadKey, obj.contentType],
        );
        await tx.query('update items set updated_at = now() where id = $1', [itemId]);
      });
    } catch (e) {
      await this.storage.deleteMany([uploadKey]);
      const code = (e as { code?: string; driverError?: { code?: string } }).code ?? (e as { driverError?: { code?: string } }).driverError?.code;
      if (code === '23505') throw new AppError('DUPLICATE_CERTIFICATE', undefined, DUPLICATE_DOCUMENT_MESSAGE);
      throw e;
    }
    return this.list(user, itemId);
  }

  private async present(user: UserRow, d: DocRow, itemName: string, allowedInsuranceIds: Set<string>) {
    const locked = user.plan !== 'premium' && !(d.type === 'insurance' && allowedInsuranceIds.has(d.id));
    return {
      id: d.id,
      type: d.type,
      related_object_id: d.item_id,
      related_object_name: itemName,
      uploaded_at: d.uploaded_at,
      document_format: d.mime_type === 'application/pdf' ? 'pdf' : 'image',
      locked, // Free : document conservé mais accès restreint (OFFRE PREMIUM), après résiliation par ex.
      view_url: locked ? null : await this.storage.presignGet(d.storage_key, this.config.signedUrlTtlSeconds),
      watermark: this.config.watermarkCertificates,
    };
  }

  private async allowedInsurance(itemIds: string[]): Promise<Set<string>> {
    if (!itemIds.length) return new Set();
    const rows: { id: string }[] = await this.ds.query(
      `select id from (select id, row_number() over (partition by item_id order by uploaded_at) as rn
         from documents where item_id = any($1) and type = 'insurance') t where rn <= $2`,
      [itemIds, this.config.freeInsurancePerItem],
    );
    return new Set(rows.map((r) => r.id));
  }

  async list(user: UserRow, itemId: string) {
    const item = await this.items.owned(user, itemId);
    const docs: DocRow[] = await this.ds.query('select * from documents where item_id = $1 order by uploaded_at', [itemId]);
    const allowed = await this.allowedInsurance([itemId]);
    const name = this.items.displayName(item);
    return { items: await Promise.all(docs.map((d) => this.present(user, d, name, allowed))) };
  }

  /** Vue « Documents » : certificats puis assurances (Page Documents §4). */
  async listAll(user: UserRow) {
    const items: { id: string; brand: string; model: string | null; reference_code: string | null }[] = await this.ds.query(
      'select id, brand, model, reference_code from items where user_id = $1',
      [user.id],
    );
    const names = new Map(items.map((i) => [i.id, this.items.displayName(i)]));
    const ids = items.map((i) => i.id);
    if (!ids.length) return { certificates: [], insurances: [] };
    const certs = await this.ds.query(
      'select item_id, mime_type, uploaded_at, readability_score from certificates where item_id = any($1) order by uploaded_at desc',
      [ids],
    );
    const docs: DocRow[] = await this.ds.query(
      "select * from documents where item_id = any($1) and type = 'insurance' order by uploaded_at desc",
      [ids],
    );
    const allowed = await this.allowedInsurance(ids);
    return {
      certificates: certs.map((c: { item_id: string; mime_type: string; uploaded_at: Date; readability_score: number }) => ({
        type: 'certificate',
        related_object_id: c.item_id,
        related_object_name: names.get(c.item_id),
        uploaded_at: c.uploaded_at,
        document_format: c.mime_type === 'application/pdf' ? 'pdf' : 'image',
        document_status: c.readability_score >= this.config.readabilityThreshold ? 'readable' : 'action_required',
      })),
      insurances: await Promise.all(docs.map((d) => this.present(user, d, names.get(d.item_id) ?? '', allowed))),
    };
  }

  async certificate(user: UserRow, itemId: string) {
    await this.items.owned(user, itemId);
    const [c] = await this.ds.query('select * from certificates where item_id = $1', [itemId]);
    if (!c) throw new AppError('NOT_FOUND');
    // Certificat toujours accessible, Free compris (décision P14)
    return {
      id: c.id,
      issuer_id: c.issuer_id,
      certificate_type: c.certificate_type,
      external_id: c.external_id,
      uploaded_at: c.uploaded_at,
      document_format: c.mime_type === 'application/pdf' ? 'pdf' : 'image',
      readability_status: c.readability_score >= this.config.readabilityThreshold ? 'readable' : 'unreadable',
      holder_match: c.holder_match,
      view_url: await this.storage.presignGet(c.storage_key, this.config.signedUrlTtlSeconds),
      view_url_expires_in: this.config.signedUrlTtlSeconds,
      watermark: this.config.watermarkCertificates,
    };
  }
}
