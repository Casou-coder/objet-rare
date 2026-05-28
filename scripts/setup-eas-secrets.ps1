# ============================================================
# Objet Rare — Upload des secrets EAS depuis le .env local
# Usage : .\scripts\setup-eas-secrets.ps1
# Prérequis : eas-cli installé (npm install -g eas-cli) + eas login
# ============================================================

$envFile = Join-Path $PSScriptRoot "..\app\.env"

if (-not (Test-Path $envFile)) {
  Write-Error "Fichier .env introuvable : $envFile"
  exit 1
}

$vars = @{}
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
  $parts = $line -split '=', 2
  $key   = $parts[0].Trim()
  $value = $parts[1].Trim()
  if ($value -ne '') { $vars[$key] = $value }
}

$required = @(
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'
)

Write-Host "`nUpload des secrets EAS pour le projet Objet Rare...`n"

Set-Location (Join-Path $PSScriptRoot "..\app")

foreach ($key in $required) {
  if (-not $vars.ContainsKey($key)) {
    Write-Warning "  MANQUANT : $key — ajoute-le dans .env avant de relancer"
    continue
  }
  Write-Host "  → $key"
  eas secret:create --scope project --name $key --value $vars[$key] --force 2>&1 | Out-Null
}

Write-Host "`nTerminé. Vérifie avec : eas secret:list`n"
