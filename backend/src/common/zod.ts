import type { ZodSchema } from 'zod';
import { AppError } from './errors';

/** Valide une entrée et lève VALIDATION_ERROR avec la liste des champs fautifs. */
export function parse<T>(schema: ZodSchema<T>, input: unknown): T {
  const res = schema.safeParse(input);
  if (!res.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      res.error.issues.map((i) => ({ field: i.path.join('.'), issue: i.message })),
    );
  }
  return res.data;
}
