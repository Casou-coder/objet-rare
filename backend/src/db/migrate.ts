import 'reflect-metadata';
import { loadConfig, loadDotEnv } from '../config';
import { createDataSource, runMigrations } from './database';

async function main(): Promise<void> {
  loadDotEnv();
  const ds = createDataSource(loadConfig().databaseUrl);
  await ds.initialize();
  const applied = await runMigrations(ds);
  // eslint-disable-next-line no-console
  console.log(applied.length ? `Migrations appliquées : ${applied.join(', ')}` : 'Base à jour.');
  await ds.destroy();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(`Échec des migrations : ${(e as Error).message}`);
  process.exit(1);
});
