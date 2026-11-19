import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Codes d'erreur figés (OpenAPI C8). Ne jamais renommer.
 */
export const ERROR_STATUS = {
  FREE_LIMIT_REACHED: 402,
  DUPLICATE_CERTIFICATE: 409,
  UNIQUE_ID_CONFLICT: 409,
  CERTIFICATE_NOT_READABLE: 422,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

/** Messages neutres figés (UX_FLOWS_V1 §3, décision P18). */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  FREE_LIMIT_REACHED: "Limite d’objets atteinte. Passez en Premium.",
  DUPLICATE_CERTIFICATE: 'Ce certificat est déjà associé à un objet existant.',
  UNIQUE_ID_CONFLICT: "Un conflit d’unicité a été détecté.",
  CERTIFICATE_NOT_READABLE: "Ce document n’est pas suffisamment lisible.",
  VALIDATION_ERROR: 'Certaines informations sont invalides.',
  NOT_FOUND: 'Ressource introuvable.',
  UNAUTHORIZED: 'Authentification requise.',
  FORBIDDEN: 'Action non autorisée.',
};

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly details?: unknown,
    message?: string,
  ) {
    super(message ?? ERROR_MESSAGES[code]);
  }
  get status(): number {
    return ERROR_STATUS[this.code];
  }
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Errors');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof AppError) {
      res.status(exception.status).json({
        error: { code: exception.code, message: exception.message, details: exception.details },
      });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code: ErrorCode =
        status === 404 ? 'NOT_FOUND' : status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'VALIDATION_ERROR';
      res.status(ERROR_STATUS[code]).json({ error: { code, message: ERROR_MESSAGES[code] } });
      return;
    }
    // Erreur interne : on logge uniquement le type et le message technique, jamais le payload.
    const err = exception as Error;
    this.logger.error(`${err?.name ?? 'Error'}: ${err?.message ?? 'unknown'}`);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Une erreur est survenue. Réessayez.' } });
  }
}
