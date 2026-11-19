/**
 * Configuration centralisée, lue une seule fois depuis l'environnement.
 * Aucune valeur sensible n'est loggée.
 */
export type AuthMode = 'firebase' | 'dev';
export type StorageMode = 's3' | 'memory';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  /** URL publique de l'API (utilisée par le stockage de développement). */
  publicUrl: string;
  databaseUrl: string;
  authMode: AuthMode;
  firebaseProjectId?: string;
  /** Compte de service Firebase Admin (JSON décodé). Absent : identifiants par défaut (GOOGLE_APPLICATION_CREDENTIALS). */
  firebaseServiceAccount?: Record<string, unknown>;
  storageMode: StorageMode;
  s3: {
    bucket: string;
    region: string;
    endpoint?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle: boolean;
  };
  signedUrlTtlSeconds: number;
  readabilityThreshold: number;
  watermarkCertificates: boolean;
  watermarkPhotos: boolean;
  freeItemLimit: number;
  freeTimeseriesPoints: number;
  freeInsurancePerItem: number;
  draftTtlHours: number;
  revenueCatWebhookSecret?: string;
}

function bool(v: string | undefined, def: boolean): boolean {
  if (v === undefined) return def;
  return v === '1' || v.toLowerCase() === 'true';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const authMode = (env.AUTH_MODE ?? 'firebase') as AuthMode;
  if (authMode === 'dev' && nodeEnv === 'production') {
    throw new Error('AUTH_MODE=dev est interdit en production');
  }
  if (authMode !== 'dev' && authMode !== 'firebase') {
    throw new Error('AUTH_MODE doit valoir firebase ou dev');
  }
  let firebaseServiceAccount: Record<string, unknown> | undefined;
  if (env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      firebaseServiceAccount = JSON.parse(Buffer.from(env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
    } catch {
      // Le contenu n'est jamais affiché.
      throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 illisible (JSON encodé en base64 attendu)');
    }
  }
  const firebaseProjectId =
    env.FIREBASE_PROJECT_ID || (firebaseServiceAccount?.project_id as string | undefined) || undefined;
  if (authMode === 'firebase' && !firebaseProjectId) {
    throw new Error('AUTH_MODE=firebase : FIREBASE_PROJECT_ID est requis');
  }
  const storageMode = (env.STORAGE_MODE ?? 's3') as StorageMode;
  if (storageMode === 'memory' && nodeEnv === 'production') {
    throw new Error('STORAGE_MODE=memory est interdit en production');
  }
  return {
    nodeEnv,
    port: Number(env.PORT ?? 3000),
    publicUrl: (env.PUBLIC_URL ?? `http://localhost:${env.PORT ?? 3000}`).replace(/\/$/, ''),
    databaseUrl: env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/vault',
    authMode,
    firebaseProjectId,
    firebaseServiceAccount,
    storageMode,
    s3: {
      bucket: env.S3_BUCKET ?? 'vault-documents',
      region: env.S3_REGION ?? 'eu-west-3',
      endpoint: env.S3_ENDPOINT || undefined,
      accessKeyId: env.S3_ACCESS_KEY_ID || undefined,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY || undefined,
      forcePathStyle: bool(env.S3_FORCE_PATH_STYLE, false),
    },
    signedUrlTtlSeconds: Number(env.SIGNED_URL_TTL_SECONDS ?? 300),
    readabilityThreshold: 65,
    watermarkCertificates: bool(env.WATERMARK_CERTIFICATES, true),
    watermarkPhotos: bool(env.WATERMARK_PHOTOS, false),
    freeItemLimit: 3,
    freeTimeseriesPoints: 6,
    freeInsurancePerItem: 1,
    draftTtlHours: 24,
    revenueCatWebhookSecret: env.REVENUECAT_WEBHOOK_SECRET || undefined,
  };
}

export const CONFIG = Symbol('CONFIG');

/** Charge backend/.env s'il existe, sans écraser les variables déjà définies. */
export function loadDotEnv(path = require('path').join(__dirname, '..', '.env')): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs') as typeof import('fs');
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
