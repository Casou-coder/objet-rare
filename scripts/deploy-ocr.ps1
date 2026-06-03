# Deploy OCR Edge Function + configure webhook
# Run from project root: .\scripts\deploy-ocr.ps1

param(
  [Parameter(Mandatory=$true)]
  [string]$OpenAIKey
)

Write-Host "1. Deploying process-ocr edge function..."
npx supabase functions deploy process-ocr

Write-Host "2. Setting OpenAI secret..."
npx supabase secrets set OPENAI_API_KEY=$OpenAIKey

Write-Host "3. Done. Now configure the webhook in Supabase Dashboard:"
Write-Host "   Dashboard → Database → Webhooks → Create webhook"
Write-Host "   Name   : process-ocr"
Write-Host "   Table  : documents"
Write-Host "   Events : INSERT"
Write-Host "   URL    : https://mphvgiqaolzbmguxfexs.supabase.co/functions/v1/process-ocr"
Write-Host "   Headers: Authorization: Bearer <SUPABASE_ANON_KEY>"
Write-Host "            Content-Type: application/json"
