import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const SYSTEM_PROMPT = `Tu es un assistant d'extraction de données depuis des documents (factures, certificats, garanties).
Extrais les informations structurées et retourne-les en JSON uniquement, sans markdown.
Champs à extraire si présents : amount, total_amount, price, date, invoice_date, expiry_date,
vendor, seller, buyer, brand, model, serial_number, reference, currency, invoice_number,
certificate_number, condition, authenticity, notes, warranty_expires.
Si un champ est absent, ne l'inclus pas. Valeurs en string.`;

async function extractWithOpenAI(fileUrl: string, mimeType: string): Promise<Record<string, string>> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY manquant');

  const isImage = mimeType.startsWith('image/');
  const isPdf   = mimeType === 'application/pdf';

  if (!isImage && !isPdf) {
    throw new Error(`Type non supporté : ${mimeType}`);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: fileUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: 'Extrais les données de ce document.',
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content ?? '{}';

  try {
    return JSON.parse(content);
  } catch {
    return { raw_text: content };
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let record: Record<string, unknown>;
  try {
    const body = await req.json();
    // Supabase database webhook envoie { type, table, record, old_record }
    record = body.record ?? body;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const docId      = record.id as string;
  const storagePath = record.storage_path as string;
  const mimeType   = (record.mime_type as string | undefined) ?? 'image/jpeg';

  if (!docId || !storagePath) {
    return new Response('Missing id or storage_path', { status: 400 });
  }

  // Marquer comme en cours de traitement
  await supabase
    .from('documents')
    .update({ ocr_status: 'pending' })
    .eq('id', docId);

  try {
    // Générer une URL signée pour que OpenAI puisse accéder au fichier
    const { data: signedData, error: signedErr } = await supabase.storage
      .from('documents')
      .createSignedUrl(storagePath, 120);

    if (signedErr || !signedData?.signedUrl) {
      throw new Error(`Impossible de générer une URL signée : ${signedErr?.message}`);
    }

    const ocrData = await extractWithOpenAI(signedData.signedUrl, mimeType);

    await supabase
      .from('documents')
      .update({ ocr_status: 'done', ocr_data: ocrData })
      .eq('id', docId);

    return new Response(JSON.stringify({ success: true, docId }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`OCR failed for doc ${docId}:`, message);

    await supabase
      .from('documents')
      .update({ ocr_status: 'failed', ocr_data: null })
      .eq('id', docId);

    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
