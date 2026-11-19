# Vault — backend (v0.1.0)

NestJS + PostgreSQL + Firebase Auth + stockage S3. Contrat d'API : [`docs/openapi.yaml`](../docs/openapi.yaml).
Décisions produit et techniques : [`docs/DECISIONS.md`](../docs/DECISIONS.md).

## Démarrer en local (Windows / PowerShell)

Prérequis : Node.js 20+, PostgreSQL 15+.

```powershell
cd backend
npm install
copy .env.example .env   # puis renseigner DATABASE_URL et TEST_DATABASE_URL
npm run migrate
npm run dev              # http://localhost:3000/health
```

En local, `AUTH_MODE=dev` accepte le jeton `Bearer dev:<uid>:<email>` et `STORAGE_MODE=memory`
garde les fichiers en mémoire. Ces deux modes sont refusés au démarrage si `NODE_ENV=production`.

Avec Firebase (`AUTH_MODE=firebase`), voir [docs/FIREBASE.md](../docs/FIREBASE.md) : `FIREBASE_PROJECT_ID` et un compte
de service (`GOOGLE_APPLICATION_CREDENTIALS` en local, `FIREBASE_SERVICE_ACCOUNT_BASE64` en hébergement).

## Tests

```powershell
npm test   # unitaires + e2e sur PostgreSQL réel (TEST_DATABASE_URL, base vidée à chaque suite)
```

## Flow de création (décision T2)

1. L'app génère un UUID v4 `id` (brouillon).
2. `POST /items/{id}/certificate/upload-url` → PUT du fichier sur l'URL présignée.
3. `POST /items/{id}/certificate/confirm` → empreinte SHA-256 serveur, anti-doublon global, score de lisibilité (≥ 65), OCR (préremplissage).
4. (facultatif) `POST /items/{id}/photo/upload-url` → PUT de la photo.
5. `POST /items` avec `id` → validations, limite Free (transaction verrouillée), unicité de l'identifiant (conflit enregistré), création.

Aucun objet n'est visible avant l'étape 5. Les brouillons abandonnés sont purgés après 24 h.

## Points d'extension non branchés

- `src/providers/providers.ts` : OCR (`OcrProvider`) et valeur de marché (`MarketProvider`).
- Notification de conflit : reportée (décision P10). Les conflits sont dans la table `conflicts`.
