import { supabase } from '@/lib/supabase';
import { useAuth } from '@/stores/auth';
import type { Item } from '@/types/database';
import type { ItemFormValues } from './schemas';

const LIST_COLUMNS = 'id, name, brand, model, category, cover_photo_url, purchase_price, purchase_currency, created_at';

export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Item[];
}

export async function fetchItem(id: string): Promise<Item> {
  const { data, error } = await supabase.from('items').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Item;
}

export async function createItem(values: ItemFormValues): Promise<Item> {
  const user = useAuth.getState().user;
  if (!user) throw new Error('Non authentifié');
  const { data, error } = await supabase
    .from('items')
    .insert({ ...(values as any), owner_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}

export async function updateItem(id: string, values: Partial<ItemFormValues>): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(values)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadCoverPhoto(
  itemId: string,
  uri: string,
  ownerId: string,
): Promise<Item> {
  const ext = (uri.split('.').pop()?.split('?')[0] ?? 'jpg').toLowerCase();
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const path = `${ownerId}/${itemId}/cover.${ext}`;

  // FormData is more reliable than fetch().blob() for local file URIs on React Native
  const formData = new FormData();
  formData.append('file', { uri, name: `cover.${ext}`, type: mimeType } as any);

  const { error: storageError } = await supabase.storage
    .from('photos')
    .upload(path, formData, { upsert: true, contentType: mimeType });

  if (storageError) {
    if (storageError.message?.toLowerCase().includes('bucket')) {
      throw new Error(
        "Le bucket \"photos\" est introuvable dans Supabase Storage.\n" +
        "Crée-le dans Dashboard → Storage → New bucket (nom : photos, public : non)."
      );
    }
    throw storageError;
  }

  // Store the storage path — signed URLs are generated on demand in the UI
  const { data, error } = await supabase
    .from('items')
    .update({ cover_photo_url: path })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data as Item;
}
