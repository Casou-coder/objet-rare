import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { types } from 'pg';
import { DataSource, EntityManager } from 'typeorm';

// Colonnes DATE renvoyées telles quelles (AAAA-MM-JJ), sans conversion de fuseau horaire.
types.setTypeParser(1082, (v: string) => v);

export const DATA_SOURCE = Symbol('DATA_SOURCE');

export function createDataSource(url: string): DataSource {
  return new DataSource({ type: 'postgres', url, synchronize: false, logging: false });
}

function migrationsDir(): string {
  // fonctionne depuis src/ (ts-node) et dist/ (copie des .sql au build)
  return join(__dirname, 'migrations');
}

/** Applique les migrations SQL non encore appliquées, dans l'ordre des noms. */
export async function runMigrations(ds: DataSource): Promise<string[]> {
  await ds.query(
    'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())',
  );
  const done = new Set<string>(
    (await ds.query('select name from schema_migrations')).map((r: { name: string }) => r.name),
  );
  const applied: string[] = [];
  const files = readdirSync(migrationsDir()).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = readFileSync(join(migrationsDir(), file), 'utf8');
    await ds.transaction(async (m) => {
      await m.query(sql);
      await m.query('insert into schema_migrations(name) values ($1)', [file]);
    });
    applied.push(file);
  }
  return applied;
}

export type Tx = EntityManager;
