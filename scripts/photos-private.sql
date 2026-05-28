-- ============================================================
-- Objet Rare — Migration : bucket photos → privé
-- Coller dans Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1. Passer le bucket photos en privé
UPDATE storage.buckets
SET public = false
WHERE id = 'photos';

-- 2. Supprimer les anciennes policies (idempotent)
DROP POLICY IF EXISTS "photos: public read" ON storage.objects;
DROP POLICY IF EXISTS "photos: owner read" ON storage.objects;

-- 3. Créer la policy de lecture réservée au propriétaire
CREATE POLICY "photos: owner read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- Après avoir exécuté ce script :
-- Les anciennes URLs publiques (cover_photo_url commençant par
-- "https://...supabase.co/storage/v1/object/public/photos/...")
-- ne fonctionneront plus directement.
-- L'app génère désormais des signed URLs (5 min) à la volée,
-- et les nouvelles photos uploadées stockent le chemin brut.
-- ============================================================
