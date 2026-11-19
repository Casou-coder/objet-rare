import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AppConfig } from '../config';

export const STORAGE = Symbol('STORAGE');

/** Stockage objet compatible S3. Toutes les URLs sont présignées et temporaires. */
export interface Storage {
  presignPut(key: string, contentType: string, ttlSeconds: number): Promise<string>;
  presignGet(key: string, ttlSeconds: number): Promise<string>;
  /** Lit l'objet téléversé (null s'il n'existe pas). */
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  deleteMany(keys: string[]): Promise<void>;
}

export class S3Storage implements Storage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(cfg: AppConfig['s3']) {
    this.bucket = cfg.bucket;
    this.client = new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      forcePathStyle: cfg.forcePathStyle,
      credentials:
        cfg.accessKeyId && cfg.secretAccessKey
          ? { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey }
          : undefined,
    });
  }

  presignPut(key: string, contentType: string, ttl: number): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: ttl },
    );
  }

  presignGet(key: string, ttl: number): Promise<string> {
    // Content-Disposition inline : lecture dans le viewer, pas de téléchargement proposé
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key, ResponseContentDisposition: 'inline' }),
      { expiresIn: ttl },
    );
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      return null;
    }
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return { body: Buffer.from(bytes), contentType: res.ContentType ?? 'application/octet-stream' };
  }

  async deleteMany(keys: string[]): Promise<void> {
    const unique = [...new Set(keys.filter(Boolean))];
    for (let i = 0; i < unique.length; i += 1000) {
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: { Objects: unique.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
        }),
      );
    }
  }
}

/**
 * Stockage en mémoire pour le développement local et les tests (interdit en production).
 * Avec `baseUrl`, les URLs pointent vers DevStorageController (HTTP, signées HMAC) pour que l'app
 * sur téléphone puisse téléverser et afficher de vrais fichiers.
 */
export class MemoryStorage implements Storage {
  readonly objects = new Map<string, { body: Buffer; contentType: string }>();
  private readonly secret = require('crypto').randomBytes(32) as Buffer;

  constructor(private readonly baseUrl?: string) {}

  sign(method: 'PUT' | 'GET', key: string, expires: number): string {
    return require('crypto').createHmac('sha256', this.secret).update(`${method}\n${key}\n${expires}`).digest('hex');
  }

  verify(method: 'PUT' | 'GET', key: string, expires: number, sig: string): boolean {
    if (!Number.isFinite(expires) || expires < Date.now()) return false;
    const expected = this.sign(method, key, expires);
    return sig.length === expected.length && require('crypto').timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  }

  private url(kind: 'upload' | 'view', method: 'PUT' | 'GET', key: string, ttl: number): string {
    const expires = Date.now() + ttl * 1000;
    const qs = `expires=${expires}&sig=${this.sign(method, key, expires)}`;
    if (!this.baseUrl) return `memory://${kind}/${encodeURIComponent(key)}?${qs}`;
    return `${this.baseUrl}/dev-storage/${encodeURIComponent(key)}?${qs}`;
  }

  async presignPut(key: string, _contentType?: string, ttl = 300): Promise<string> {
    return this.url('upload', 'PUT', key, ttl);
  }
  async presignGet(key: string, ttl: number): Promise<string> {
    return this.url('view', 'GET', key, ttl);
  }
  async get(key: string) {
    return this.objects.get(key) ?? null;
  }
  async deleteMany(keys: string[]): Promise<void> {
    keys.forEach((k) => this.objects.delete(k));
  }
  /** Simule le PUT du client sur l'URL présignée. */
  put(key: string, body: Buffer, contentType: string): void {
    this.objects.set(key, { body, contentType });
  }
}
