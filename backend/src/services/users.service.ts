import { Inject, Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { VerifiedIdentity } from '../auth/auth';
import { AppError } from '../common/errors';
import { CONFIG, type AppConfig } from '../config';
import { DATA_SOURCE, type Tx } from '../db/database';

export interface UserRow {
  id: string;
  auth_uid: string;
  email: string | null;
  full_name: string | null;
  plan: 'free' | 'premium';
  created_at: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  /** Crée le profil au premier appel authentifié, puis le renvoie. */
  async resolve(identity: VerifiedIdentity): Promise<UserRow> {
    const rows: UserRow[] = await this.ds.query(
      `insert into users (auth_uid, email) values ($1, $2)
       on conflict (auth_uid) do update set email = coalesce(excluded.email, users.email)
       returning *`,
      [identity.uid, identity.email],
    );
    return rows[0];
  }

  /** Verrouille la ligne utilisateur : sérialise les créations concurrentes (anti-contournement Free). */
  async lock(tx: Tx, userId: string): Promise<UserRow> {
    const rows: UserRow[] = await tx.query('select * from users where id = $1 for update', [userId]);
    if (!rows[0]) throw new AppError('UNAUTHORIZED');
    return rows[0];
  }

  requireProfile(user: UserRow): void {
    if (!user.full_name) throw new AppError('FORBIDDEN', { reason: 'PROFILE_INCOMPLETE' });
  }

  async getMe(identity: VerifiedIdentity) {
    const user = await this.resolve(identity);
    const [{ items, documents }] = await this.ds.query(
      `select (select count(*)::int from items where user_id = $1) as items,
              (select count(*)::int from documents d join items i on i.id = d.item_id where i.user_id = $1)
              + (select count(*)::int from certificates c join items i on i.id = c.item_id where i.user_id = $1) as documents`,
      [user.id],
    );
    const premium = user.plan === 'premium';
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      profile_complete: Boolean(user.full_name),
      plan: user.plan,
      account_created_at: user.created_at,
      limits: {
        free_item_limit: this.config.freeItemLimit,
        items_used: items,
        can_add_item: premium || items < this.config.freeItemLimit,
        free_timeseries_points: this.config.freeTimeseriesPoints,
        free_insurance_per_item: this.config.freeInsurancePerItem,
      },
      counts: { items, documents },
    };
  }

  async putMe(identity: VerifiedIdentity, fullName: string) {
    const user = await this.resolve(identity);
    await this.ds.query('update users set full_name = $2 where id = $1', [user.id, fullName]);
    return this.getMe(identity);
  }
}
