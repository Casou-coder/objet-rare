import { Inject, Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { TOKEN_VERIFIER, type TokenVerifier } from '../auth/auth';
import { DATA_SOURCE } from '../db/database';
import { STORAGE, type Storage } from '../storage/storage';
import { ItemsService } from './items.service';
import type { UserRow } from './users.service';

/** Suppression du compte : irréversible, aucune donnée conservée (CONTRAT §10.2, BUSINESS_RULES §8). */
@Injectable()
export class AccountService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier,
    private readonly items: ItemsService,
  ) {}

  async delete(user: UserRow): Promise<void> {
    const itemIds: string[] = (await this.ds.query('select id from items where user_id = $1', [user.id])).map(
      (r: { id: string }) => r.id,
    );
    const drafts: { certificate_key: string | null; photo_key: string | null }[] = await this.ds.query(
      'select certificate_key, photo_key from item_drafts where user_id = $1',
      [user.id],
    );
    const keys = [
      ...(await this.items.storageKeysForItems(this.ds, itemIds)),
      ...drafts.flatMap((d) => [d.certificate_key, d.photo_key]).filter((k): k is string => Boolean(k)),
    ];
    await this.storage.deleteMany(keys);
    await this.ds.transaction(async (tx) => {
      if (itemIds.length) await tx.query('delete from conflicts where existing_item_id = any($1)', [itemIds]);
      // cascade : objets, certificats, documents, empreintes, valeurs, brouillons, journaux, conflits tentés
      await tx.query('delete from users where id = $1', [user.id]);
    });
    await this.verifier.deleteUser(user.auth_uid);
  }
}
