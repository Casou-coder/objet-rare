import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// This function requires a Supabase SQL function to be created once.
// Run the following in the Supabase SQL editor (Dashboard → SQL editor):
//
//   CREATE OR REPLACE FUNCTION public.delete_user()
//   RETURNS void
//   LANGUAGE plpgsql
//   SECURITY DEFINER
//   SET search_path = public
//   AS $$
//   BEGIN
//     DELETE FROM auth.users WHERE id = auth.uid();
//   END;
//   $$;
//
//   REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
//   GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteAccount(): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Non authentifié');

  // 1. Delete document storage files (non-blocking failures tolerated)
  const { data: docs } = await supabase
    .from('documents')
    .select('storage_path')
    .eq('owner_id', user.id);
  if (docs?.length) {
    await supabase.storage.from('documents').remove(docs.map((d) => d.storage_path));
  }

  // 2. Delete cover photo files — stored at {userId}/{itemId}/{filename}
  const { data: itemFolders } = await supabase.storage.from('photos').list(user.id);
  if (itemFolders?.length) {
    const photoPaths: string[] = [];
    for (const folder of itemFolders) {
      const { data: files } = await supabase.storage
        .from('photos')
        .list(`${user.id}/${folder.name}`);
      photoPaths.push(...(files ?? []).map((f) => `${user.id}/${folder.name}/${f.name}`));
    }
    if (photoPaths.length) {
      await supabase.storage.from('photos').remove(photoPaths);
    }
  }

  // 3. Delete data rows (FK cascade handles profiles if configured; explicit otherwise)
  await supabase.from('documents').delete().eq('owner_id', user.id);
  await supabase.from('items').delete().eq('owner_id', user.id);

  // 4. Delete the Supabase auth user via the SQL function above
  const { error: rpcError } = await supabase.rpc('delete_user');
  if (rpcError) throw rpcError;

  // 5. Clear the local session
  await supabase.auth.signOut();
}
