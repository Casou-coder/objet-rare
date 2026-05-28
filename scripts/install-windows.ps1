# =============================================================================
# install-windows.ps1
# Installe l'environnement de dev pour "Objet Rare" (Expo + React Native).
# Lancer depuis PowerShell : pwsh -ExecutionPolicy Bypass -File install-windows.ps1
# (la première fois, l'élévation Admin sera demandée pour installer Node/VS Code)
# =============================================================================

$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# -----------------------------------------------------------------------------
# 0. Vérifier winget (installeur de paquets Windows)
# -----------------------------------------------------------------------------
Write-Step "Vérification de winget"
if (-not (Test-Command winget)) {
    Write-Host "winget n'est pas disponible. Installe-le depuis le Microsoft Store ('App Installer'), puis relance ce script." -ForegroundColor Red
    exit 1
}
Write-Host "winget OK." -ForegroundColor Green

# -----------------------------------------------------------------------------
# 1. Node.js LTS
# -----------------------------------------------------------------------------
Write-Step "Node.js LTS"
if (-not (Test-Command node)) {
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    Write-Host "Node installé. Ferme/rouvre ton terminal après le script pour rafraîchir le PATH." -ForegroundColor Yellow
} else {
    Write-Host "Node déjà installé : $(node --version)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 2. Git
# -----------------------------------------------------------------------------
Write-Step "Git"
if (-not (Test-Command git)) {
    winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
} else {
    Write-Host "Git déjà installé : $(git --version)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 3. VS Code
# -----------------------------------------------------------------------------
Write-Step "Visual Studio Code"
if (-not (Test-Command code)) {
    winget install -e --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements
    Write-Host "VS Code installé. Ferme/rouvre ton terminal après le script." -ForegroundColor Yellow
} else {
    Write-Host "VS Code déjà installé." -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 4. pnpm (gestionnaire de paquets — plus rapide que npm)
# -----------------------------------------------------------------------------
Write-Step "pnpm"
if (-not (Test-Command pnpm)) {
    npm install -g pnpm
} else {
    Write-Host "pnpm déjà installé : $(pnpm --version)" -ForegroundColor Green
}

# -----------------------------------------------------------------------------
# 5. Outils Expo (eas-cli + expo-cli)
# -----------------------------------------------------------------------------
Write-Step "Expo CLI + EAS CLI"
npm install -g eas-cli expo

# -----------------------------------------------------------------------------
# 6. Extensions VS Code (depuis .vscode/extensions.json)
# -----------------------------------------------------------------------------
Write-Step "Extensions VS Code"
$extensions = @(
    'expo.vscode-expo-tools',
    'dbaeumer.vscode-eslint',
    'esbenp.prettier-vscode',
    'bradlc.vscode-tailwindcss',
    'msjsdiag.vscode-react-native',
    'supabase.vscode-supabase-extension',
    'eamodio.gitlens',
    'usernamehw.errorlens',
    'christian-kohler.path-intellisense',
    'yoavbls.pretty-ts-errors',
    'wix.vscode-import-cost',
    'streetsidesoftware.code-spell-checker',
    'streetsidesoftware.code-spell-checker-french',
    'mikestead.dotenv'
)
foreach ($ext in $extensions) {
    Write-Host "  Installing $ext..."
    code --install-extension $ext --force | Out-Null
}

# -----------------------------------------------------------------------------
# 7. Dépendances du projet
# -----------------------------------------------------------------------------
$projectRoot = Split-Path -Parent $PSScriptRoot
$appRoot = Join-Path $projectRoot 'app'

Write-Step "Installation des dépendances du projet ($appRoot)"
Push-Location $appRoot
try {
    if (-not (Test-Path '.env')) {
        Copy-Item '.env.example' '.env'
        Write-Host ".env créé depuis .env.example — remplis tes clés Supabase avant de lancer l'app." -ForegroundColor Yellow
    }
    pnpm install
}
finally {
    Pop-Location
}

# -----------------------------------------------------------------------------
# Récap
# -----------------------------------------------------------------------------
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Green
Write-Host " Installation terminée." -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes :"
Write-Host "  1. Crée tes comptes externes (voir docs/COMPTES_A_CREER.md)"
Write-Host "  2. Remplis app/.env avec tes clés Supabase"
Write-Host "  3. Ouvre le projet : code `"$projectRoot`""
Write-Host "  4. Démarre l'app : cd app ; pnpm start"
Write-Host "  5. Installe 'Expo Go' sur ton téléphone Android et scanne le QR code"
Write-Host ""
