import { supabase } from '@/lib/supabase';
import type { DocumentRow, DocumentType } from '@/types/database';

export async function fetchDocuments(itemId?: string): Promise<DocumentRow[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  if (itemId) query = query.eq('item_id', itemId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function uploadDocument(params: {
  uri: string;
  filename: string;
  mimeType: string;
  type: DocumentType;
  itemId?: string;
  ownerId: string;
}): Promise<DocumentRow> {
  const { uri, filename, mimeType, type, itemId, ownerId } = params;

  const ext = filename.split('.').pop() ?? 'bin';
  const storagePath = `${ownerId}/${Date.now()}.${ext}`;

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, blob, { contentType: mimeType });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      owner_id: ownerId,
      item_id: itemId ?? null,
      type,
      storage_path: storagePath,
      filename,
      ocr_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from('documents').remove([storagePath]);
    throw error;
  }
  return data as DocumentRow;
}

export async function getDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 300); // 5 min
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(id: string, storagePath: string): Promise<void> {
  await supabase.storage.from('documents').remove([storagePath]);
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export async function renameDocument(id: string, filename: string): Promise<void> {
  const { error } = await supabase.from('documents').update({ filename }).eq('id', id);
  if (error) throw error;
}

export async function updateDocumentExpiry(id: string, expiresAt: string | null): Promise<void> {
  const { error } = await supabase.from('documents').update({ expires_at: expiresAt }).eq('id', id);
  if (error) throw error;
}
