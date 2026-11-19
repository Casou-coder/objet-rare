import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplication } from '@nestjs/common';
import { AppModule, type AppOverrides } from './app.module';
import { AppExceptionFilter } from './common/errors';
import { loadConfig, loadDotEnv, type AppConfig } from './config';
import { createDataSource, runMigrations } from './db/database';

export async function createApp(config: AppConfig, overrides: AppOverrides = {}): Promise<INestApplication> {
  // Logger Nest limité : pas de corps de requête ni d'en-têtes dans les logs
  const app = await NestFactory.create(AppModule.register(config, overrides), {
    logger: config.nodeEnv === 'test' ? false : ['error', 'warn', 'log'],
  });
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableShutdownHooks();
  return app;
}

async function bootstrap(): Promise<void> {
  loadDotEnv();
  const config = loadConfig();
  const ds = createDataSource(config.databaseUrl);
  await ds.initialize();
  await runMigrations(ds);
  const app = await createApp(config, { dataSource: ds });
  await app.listen(config.port, '0.0.0.0');
}

if (require.main === module) {
  bootstrap().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(`Démarrage impossible : ${(e as Error).message}`);
    process.exit(1);
  });
}
