import 'reflect-metadata';
import { join } from 'path';
import sharp from 'sharp';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { loadConfig, loadDotEnv } from '../src/config';
import { createDataSource, runMigrations } from '../src/db/database';
import { createApp } from '../src/main';
import { DevTokenVerifier } from '../src/auth/auth';
import { MemoryStorage } from '../src/storage/storage';
import type { MarketProvider, OcrProvider } from '../src/providers/providers';

const loadEnv = () => loadDotEnv(join(__dirname, '..', '.env'));

export interface TestCtx {
  app: INestApplication;
  ds: DataSource;
  storage: MemoryStorage;
  verifier: DevTokenVerifier;
  http: () => ReturnType<typeof request>;
}

export async function setupApp(opts: { ocr?: OcrProvider; market?: MarketProvider } = {}): Promise<TestCtx> {
  loadEnv();
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL manquant (backend/.env)');
  const ds = createDataSource(url);
  await ds.initialize();
  await ds.query('drop schema public cascade; create schema public;');
  await runMigrations(ds);
  const storage = new MemoryStorage();
  const verifier = new DevTokenVerifier();
  const config = { ...loadConfig({ NODE_ENV: 'test', AUTH_MODE: 'dev', STORAGE_MODE: 'memory' }), databaseUrl: url };
  const app = await createApp(config, { dataSource: ds, storage, verifier, ocr: opts.ocr, market: opts.market });
  await app.init();
  return { app, ds, storage, verifier, http: () => request(app.getHttpServer()) };
}

export const auth = (uid: string, email = `${uid}@example.test`) => ({ Authorization: `Bearer dev:${uid}:${email}` });

let seq = 0;
/** Image de certificat lisible, unique à chaque appel (empreinte différente). */
export async function readableCertificate(label = 'CERTIFICAT'): Promise<Buffer> {
  seq++;
  const lines = Array.from({ length: 14 }, (_, i) =>
    `<text x="60" y="${120 + i * 70}" font-family="Arial" font-size="40" fill="#111">${label} ${seq}-${i} SERIE 0X${(seq * 7919 + i).toString(16)} PROPRIETAIRE</text>`,
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><rect width="100%" height="100%" fill="#fafafa"/>${lines}</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Image floue, peu contrastée et basse résolution : illisible. */
export async function unreadableCertificate(): Promise<Buffer> {
  seq++;
  return sharp({ create: { width: 320, height: 240, channels: 3, background: { r: 128 + (seq % 5), g: 128, b: 128 } } })
    .blur(10)
    .png()
    .toBuffer();
}

/** Ajoute un certificat lisible à un brouillon et le confirme. */
export async function attachCertificate(ctx: TestCtx, uid: string, draftId: string, file?: Buffer) {
  const up = await ctx.http().post(`/items/${draftId}/certificate/upload-url`).set(auth(uid)).send({ content_type: 'image/png', size_bytes: 1000 });
  if (up.status !== 201) return up;
  ctx.storage.put(up.body.upload_key, file ?? (await readableCertificate()), 'image/png');
  return ctx.http().post(`/items/${draftId}/certificate/confirm`).set(auth(uid)).send({ category: 'watch' });
}

export function watchPayload(id: string, serial: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    category: 'watch',
    brand: 'Rolex',
    model: 'Submariner',
    serial_number: serial,
    acquisition_price: { amount: 9500, currency: 'EUR' },
    issuer_id: 'brand',
    certificate_type: 'card',
    declaration_accepted: true,
    ...extra,
  };
}

export async function completeProfile(ctx: TestCtx, uid: string, name = 'Jean Dupont') {
  await ctx.http().put('/me').set(auth(uid)).send({ full_name: name }).expect(200);
}
