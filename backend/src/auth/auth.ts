import { CanActivate, ExecutionContext, Inject, Injectable, Logger, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../common/errors';
import { CONFIG, type AppConfig } from '../config';

export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');

export interface VerifiedIdentity {
  uid: string;
  email: string | null;
}

export interface TokenVerifier {
  verify(token: string): Promise<VerifiedIdentity>;
  deleteUser(uid: string): Promise<void>;
}

/** Vérification des ID tokens Firebase (US2.2). */
export class FirebaseTokenVerifier implements TokenVerifier {
  private auth: import('firebase-admin/auth').Auth;

  private readonly logger = new Logger('Auth');

  /**
   * Identifiants Admin : compte de service (FIREBASE_SERVICE_ACCOUNT_BASE64) ou, à défaut,
   * GOOGLE_APPLICATION_CREDENTIALS. Requis pour le contrôle de révocation et la suppression de compte.
   */
  constructor(projectId?: string, serviceAccount?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initializeApp, getApps, applicationDefault, cert } = require('firebase-admin/app');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAuth } = require('firebase-admin/auth');
    const credential = serviceAccount
      ? cert(serviceAccount)
      : process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? applicationDefault()
        : undefined;
    const app = getApps()[0] ?? initializeApp(credential ? { credential, projectId } : { projectId });
    this.auth = getAuth(app);
  }

  async verify(token: string): Promise<VerifiedIdentity> {
    try {
      const decoded = await this.auth.verifyIdToken(token, true);
      return { uid: decoded.uid, email: decoded.email ?? null };
    } catch (e) {
      // Seul le code d'erreur est journalisé, jamais le jeton.
      const code = (e as { code?: string }).code ?? 'unknown';
      if (!/id-token-(expired|revoked)|argument-error|user-disabled|user-not-found/.test(code)) {
        this.logger.warn(`Vérification du jeton impossible (${code})`);
      }
      throw e;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.auth.deleteUser(uid);
    } catch (e) {
      if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
    }
  }
}

/**
 * Mode développement uniquement (refusé en production par loadConfig) :
 * jeton « dev:<uid> » ou « dev:<uid>:<email> ».
 */
export class DevTokenVerifier implements TokenVerifier {
  readonly deleted: string[] = [];
  async verify(token: string): Promise<VerifiedIdentity> {
    const m = /^dev:([A-Za-z0-9_-]{1,64})(?::(.+))?$/.exec(token);
    if (!m) throw new Error('invalid dev token');
    return { uid: m[1], email: m[2] ?? null };
  }
  async deleteUser(uid: string): Promise<void> {
    this.deleted.push(uid);
  }
}

export interface AuthedRequest extends Request {
  identity?: VerifiedIdentity;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier,
    @Inject(CONFIG) private readonly config: AppConfig,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) throw new AppError('UNAUTHORIZED');
    try {
      req.identity = await this.verifier.verify(token);
    } catch {
      throw new AppError('UNAUTHORIZED');
    }
    return true;
  }
}

export const Identity = createParamDecorator((_: unknown, ctx: ExecutionContext): VerifiedIdentity => {
  const req = ctx.switchToHttp().getRequest<AuthedRequest>();
  if (!req.identity) throw new AppError('UNAUTHORIZED');
  return req.identity;
});
