import { Inject, Injectable, Logger } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { CONFIG, type AppConfig } from '../config';
import { DATA_SOURCE } from '../db/database';
import { MARKET_PROVIDER, type MarketProvider } from '../providers/providers';
import { ItemsService } from './items.service';
import type { UserRow } from './users.service';

const DISCLAIMER =
  'Valeur indicative basée sur des sources de marché publiques. Elle ne constitue ni une expertise ni une recommandation.';

@Injectable()
export class ValueService {
  private readonly logger = new Logger('Value');

  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(MARKET_PROVIDER) private readonly market: MarketProvider,
    @Inject(CONFIG) private readonly config: AppConfig,
    private readonly items: ItemsService,
  ) {}

  async get(user: UserRow, itemId: string) {
    await this.items.owned(user, itemId);
    const [mv] = await this.ds.query('select * from market_values where item_id = $1', [itemId]);
    return {
      value_amount: mv?.value_amount === null || mv?.value_amount === undefined ? null : Number(mv.value_amount),
      currency: mv?.currency ?? null,
      confidence: mv?.confidence ?? null,
      sources: mv?.sources ?? [],
      as_of: mv?.as_of ?? null,
      status: mv?.status ?? 'idle',
      disclaimer: DISCLAIMER,
    };
  }

  /** Rafraîchissement asynchrone (US9.2) : 202, puis mise à jour de market_values. */
  async refresh(user: UserRow, itemId: string) {
    const item = await this.items.owned(user, itemId);
    await this.ds.query(
      `insert into market_values (item_id, status) values ($1, 'updating')
       on conflict (item_id) do update set status = 'updating', updated_at = now()`,
      [itemId],
    );
    setImmediate(() => {
      this.compute(item).catch((e) => this.logger.error(`refresh failed: ${(e as Error).name}`));
    });
    return { status: 'updating' };
  }

  async compute(item: { id: string; category: string; brand: string; model: string | null; reference_code: string | null }) {
    const quote = await this.market.quote(item);
    if (!quote || quote.amount === null) {
      await this.ds.query("update market_values set status = 'idle', updated_at = now() where item_id = $1", [item.id]);
      return;
    }
    await this.ds.transaction(async (tx) => {
      await tx.query(
        `update market_values set value_amount = $2, currency = $3, confidence = $4, sources = $5, as_of = $6,
         status = 'idle', updated_at = now() where item_id = $1`,
        [item.id, quote.amount, quote.currency, quote.confidence, JSON.stringify(quote.sources), quote.as_of],
      );
      await tx.query(
        `insert into value_timeseries (item_id, as_of_date, value_amount, currency, source) values ($1, $2::date, $3, $4, $5)
         on conflict (item_id, as_of_date) do update set value_amount = excluded.value_amount`,
        [item.id, quote.as_of.toISOString().slice(0, 10), quote.amount, quote.currency, quote.sources.join(',') || 'market'],
      );
    });
  }

  /** Historique : complet en Premium, 6 derniers points en Free (décision P4). */
  async timeseries(user: UserRow, itemId: string) {
    await this.items.owned(user, itemId);
    const premium = user.plan === 'premium';
    const rows = await this.ds.query(
      `select to_char(as_of_date, 'YYYY-MM-DD') as as_of_date, value_amount, currency, source from value_timeseries where item_id = $1
       order by as_of_date desc ${premium ? '' : 'limit $2'}`,
      premium ? [itemId] : [itemId, this.config.freeTimeseriesPoints + 1],
    );
    const limited = !premium && rows.length > this.config.freeTimeseriesPoints;
    const points = rows
      .slice(0, premium ? rows.length : this.config.freeTimeseriesPoints)
      .reverse()
      .map((r: { as_of_date: string; value_amount: string; currency: string; source: string }) => ({
        as_of_date: r.as_of_date,
        value_amount: Number(r.value_amount),
        currency: r.currency,
        source: r.source,
      }));
    return { points, limited };
  }
}
