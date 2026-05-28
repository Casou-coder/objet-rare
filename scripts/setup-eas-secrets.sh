#!/bin/bash
# ============================================================
# Objet Rare — Upload des secrets EAS depuis le .env local
# Usage : bash scripts/setup-eas-secrets.sh
# Prérequis : eas-cli installé (npm install -g eas-cli) + eas login
# ============================================================

ENV_FILE="$(dirname "$0")/../app/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Fichier .env introuvable : $ENV_FILE"
  exit 1
fi

REQUIRED=(
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY
  EXPO_PUBLIC_REVENUECAT_IOS_KEY
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
)

echo ""
echo "Upload des secrets EAS pour le projet Objet Rare..."
echo ""

cd "$(dirname "$0")/../app"

for KEY in "${REQUIRED[@]}"; do
  VALUE=$(grep "^${KEY}=" "$ENV_FILE" | cut -d'=' -f2-)
  if [ -z "$VALUE" ]; then
    echo "  MANQUANT : $KEY — ajoute-le dans .env avant de relancer"
    continue
  fi
  echo "  → $KEY"
  eas secret:create --scope project --name "$KEY" --value "$VALUE" --force > /dev/null 2>&1
done

echo ""
echo "Terminé. Vérifie avec : eas secret:list"
echo ""
