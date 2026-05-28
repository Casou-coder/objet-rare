-- ============================================================
-- Objet Rare — Supabase Storage : bucket photos (public)
-- Coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Upload : dans son propre dossier /{user_id}/...
create policy "photos: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Lecture publique (URLs directes, pas de signed URL nécessaire)
create policy "photos: public read"
  on storage.objects for select
  using (bucket_id = 'photos');

-- Suppression par le propriétaire
create policy "photos: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
