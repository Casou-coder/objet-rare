import * as FileSystem from 'expo-file-system/legacy';
import { ApiError, type Schemas } from './client';

export interface PickedFile {
  uri: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/heic' | 'image/webp';
  size: number;
}

/** Envoie le fichier local sur l'URL présignée (PUT binaire, sans transiter par l'app serveur). */
export async function putFile(ticket: Schemas['UploadTicket'], file: PickedFile): Promise<void> {
  let res: FileSystem.FileSystemUploadResult;
  try {
    res = await FileSystem.uploadAsync(ticket.upload_url, file.uri, {
      httpMethod: 'PUT',
      headers: ticket.headers,
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });
  } catch {
    throw new ApiError('NETWORK', 0);
  }
  if (res.status < 200 || res.status >= 300) throw new ApiError('INTERNAL', res.status);
}

export async function fileSize(uri: string, fallback?: number | null): Promise<number> {
  if (fallback) return fallback;
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && 'size' in info ? info.size : 1;
}

export function normalizeMime(m?: string | null, uri?: string): PickedFile['mimeType'] {
  const v = (m ?? '').toLowerCase();
  if (v === 'application/pdf' || uri?.toLowerCase().endsWith('.pdf')) return 'application/pdf';
  if (v === 'image/png') return 'image/png';
  if (v === 'image/heic' || v === 'image/heif') return 'image/heic';
  if (v === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}
