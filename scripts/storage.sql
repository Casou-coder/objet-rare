-- ============================================================
-- Objet Rare — Supabase Storage : bucket documents
-- Coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Upload : chaque user ne peut uploader que dans son propre dossier (/{user_id}/...)
create policy "documents: owner upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Lecture : idem
create policy "documents: owner read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Suppression : idem
create policy "documents: owner delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
