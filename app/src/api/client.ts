import createClient from 'openapi-fetch';
import type { components, paths } from './schema';
import { useSession } from '@/stores/session';

export type Schemas = components['schemas'];
export type ErrorCode = Schemas['ErrorCode'] | 'NETWORK';

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** Erreur API typée : le code est stable (OpenAPI C8), le message est neutre. */
export class ApiError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message?: string,
    public readonly details?: unknown,
  ) {
    super(message ?? code);
  }
}

export const api = createClient<paths>({ baseUrl: API_URL });

api.use({
  async onRequest({ request }) {
    const token = await useSession.getState().getToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) useSession.getState().onUnauthorized();
    return response;
  },
});

type Result<T> = { data?: T; error?: unknown; response: Response };

/** Déballe une réponse openapi-fetch ou lève une ApiError. */
export async function unwrap<T>(p: Promise<Result<T>>): Promise<T> {
  let res: Result<T>;
  try {
    res = await p;
  } catch {
    throw new ApiError('NETWORK', 0);
  }
  if (res.response.ok) return res.data as T;
  const body = res.error as { error?: { code?: ErrorCode; message?: string; details?: unknown } } | undefined;
  throw new ApiError(body?.error?.code ?? 'INTERNAL', res.response.status, body?.error?.message, body?.error?.details);
}

export function isApiError(e: unknown, code?: ErrorCode): e is ApiError {
  return e instanceof ApiError && (code === undefined || e.code === code);
}
