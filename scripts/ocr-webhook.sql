-- ============================================================
-- Objet Rare — Webhook OCR : déclenche la edge function
-- sur chaque nouveau document inséré
--
-- Prérequis : avoir déployé la edge function process-ocr
--   eas build ou : supabase functions deploy process-ocr
--
-- Option A (recommandée) : Webhook via le Dashboard Supabase
--   Dashboard → Database → Webhooks → Create webhook
--   Name      : process-ocr
--   Table     : documents
--   Events    : INSERT
--   URL       : https://<project-ref>.supabase.co/functions/v1/process-ocr
--   HTTP Headers :
--     Authorization: Bearer <SUPABASE_ANON_KEY>
--     Content-Type : application/json
--
-- Option B : via pg_net (extension SQL)
-- Nécessite d'activer l'extension pg_net dans Extensions.
-- ============================================================

-- Active l'extension si pas encore fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction trigger
CREATE OR REPLACE FUNCTION public.trigger_ocr_on_document_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url text;
  service_key  text;
BEGIN
  function_url := current_setting('app.supabase_url', true)
                  || '/functions/v1/process-ocr';
  service_key  := current_setting('app.service_role_key', true);

  PERFORM net.http_post(
    url     := function_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body    := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger sur INSERT dans documents
DROP TRIGGER IF EXISTS on_document_inserted ON public.documents;
CREATE TRIGGER on_document_inserted
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ocr_on_document_insert();

-- ============================================================
-- Après avoir exécuté ce script, configurer les paramètres :
--   ALTER DATABASE postgres
--     SET app.supabase_url = 'https://<ref>.supabase.co';
--   ALTER DATABASE postgres
--     SET app.service_role_key = '<service_role_key>';
--
-- Puis déployer la edge function :
--   npx supabase functions deploy process-ocr
--
-- Et ajouter le secret OpenAI dans Supabase :
--   npx supabase secrets set OPENAI_API_KEY=sk-...
-- ============================================================
