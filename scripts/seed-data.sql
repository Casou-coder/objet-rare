-- ============================================================
-- Objet Rare — Données de simulation
-- Coller dans Supabase > SQL Editor > New query > Run
-- Idempotent : peut être rejoué sans créer de doublons.
-- ============================================================

-- ─── 1. Mise à jour de la Rolex Daytona ─────────────────────
--   Nom précis = la banque d'images remonte automatiquement
UPDATE items
SET
  name              = 'Cosmograph Daytona',
  brand             = 'Rolex',
  model             = 'Cosmograph Daytona',
  serial_number     = 'XXXX',
  purchase_date     = '2022-03-15',
  purchase_price    = 14500,
  purchase_currency = 'EUR',
  condition         = 'excellent',
  metadata          = '{"movement":"automatic","reference":"116500LN","year":2022,"case_size_mm":40}'::jsonb
WHERE owner_id = (SELECT id FROM profiles WHERE email = 'clement.dupas@hotmail.fr')
  AND category = 'watch';

-- ─── 2. Ajout de l'Audemars Piguet Royal Oak ────────────────
INSERT INTO items (owner_id, category, brand, model, name, serial_number,
                   purchase_date, purchase_price, purchase_currency, condition, metadata)
SELECT
  id,
  'watch',
  'Audemars Piguet',
  'Royal Oak',
  'Royal Oak',
  'XXXX',
  '2021-09-10',
  28000,
  'EUR',
  'excellent',
  '{"movement":"automatic","reference":"15400ST.OO.1220ST.01","year":2021,"case_size_mm":41}'::jsonb
FROM profiles
WHERE email = 'clement.dupas@hotmail.fr'
  AND NOT EXISTS (
    SELECT 1 FROM items
    WHERE owner_id = (SELECT id FROM profiles WHERE email = 'clement.dupas@hotmail.fr')
      AND brand = 'Audemars Piguet'
  );

-- ─── 3. Documents Rolex Daytona ─────────────────────────────
-- Nettoyage idempotent
DELETE FROM documents
WHERE owner_id = (SELECT id FROM profiles WHERE email = 'clement.dupas@hotmail.fr')
  AND storage_path LIKE 'sim/rolex-%';

INSERT INTO documents (owner_id, item_id, type, storage_path, filename, ocr_status, ocr_data)
SELECT
  i.owner_id,
  i.id,
  d.doc_type::document_type,
  d.storage_path,
  d.filename,
  d.ocr_status::ocr_status,
  d.ocr_data::jsonb
FROM items i
CROSS JOIN (VALUES
  ('certificate',
   'sim/rolex-daytona-cert.pdf',
   'Certificat_Authenticite_Rolex.pdf',
   'done',
   '{"brand":"Rolex","ref":"116500LN","serial":"XXXX","year":2022,"condition":"excellent"}'),
  ('warranty',
   'sim/rolex-daytona-warranty.pdf',
   'Garantie_Rolex_5ans.pdf',
   'done',
   '{"brand":"Rolex","warranty_years":5,"valid_until":"2027-03-15","dealer":"Bucherer Paris"}'),
  ('invoice',
   'sim/rolex-daytona-invoice.pdf',
   'Facture_Daytona_14500EUR.pdf',
   'done',
   '{"seller":"Bucherer Paris","amount":14500,"currency":"EUR","date":"2022-03-15"}')
) AS d(doc_type, storage_path, filename, ocr_status, ocr_data)
WHERE i.owner_id = (SELECT id FROM profiles WHERE email = 'clement.dupas@hotmail.fr')
  AND i.brand = 'Rolex';

-- ─── 4. Documents Audemars Piguet Royal Oak ─────────────────
-- Nettoyage idempotent
DELETE FROM documents
WHERE owner_id = (SELECT id FROM profiles WHERE email = 'clement.dupas@hotmail.fr')
  AND storage_path LIKE 'sim/ap-%';

INSERT INTO documents (owner_id, item_id, type, storage_path, filename, ocr_status, ocr_data)
SELECT
  i.owner_id,
  i.id,
  d.doc_type::document_type,
  d.storage_path,
  d.filename,
  d.ocr_status::ocr_status,
  d.ocr_data::jsonb
FROM items i
CROSS JOIN (VALUES
  ('certificate',
   'sim/ap-royal-oak-cert.pdf',
   'Certificat_Authenticite_AP.pdf',
   'done',
   '{"brand":"Audemars Piguet","ref":"15400ST.OO.1220ST.01","serial":"XXXX","year":2021}'),
  ('warranty',
   'sim/ap-royal-oak-warranty.pdf',
   'Garantie_AP_2ans.pdf',
   'pending',
   NULL),
  ('invoice',
   'sim/ap-royal-oak-invoice.pdf',
   'Facture_Royal_Oak_28000EUR.pdf',
   'failed',
   NULL)
) AS d(doc_type, storage_path, filename, ocr_status, ocr_data)
WHERE i.owner_id = (SELECT id FROM profiles WHERE email = 'clement.dupas@hotmail.fr')
  AND i.brand = 'Audemars Piguet';
