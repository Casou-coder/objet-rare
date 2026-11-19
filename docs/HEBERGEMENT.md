# Mettre l'API en ligne gratuitement — guide pas à pas

Choix du 2026-11-19 (décision P20) : **Neon** (PostgreSQL) + **Backblaze B2** (documents) + **Render** (API),
formules gratuites, en Europe. Durée : environ 30 minutes.

Tu crées les comptes et saisis toi-même chaque secret. **Ne colle aucun secret dans le dépôt ni dans le chat** :
ils vont uniquement dans les écrans de Render (et dans `app/.env` pour l'URL de l'API, qui n'est pas secrète).

Prépare un bloc-notes **hors du dossier du projet** (ou ton gestionnaire de mots de passe) pour noter les valeurs
au fur et à mesure ; supprime-le une fois Render configuré.

---

## 1. Base de données — Neon

1. https://neon.tech → **Sign up** (avec ton compte GitHub ou une adresse e-mail).
2. **Create project** :
   - Project name : `or-vault`
   - Postgres version : la plus récente proposée
   - Region : **AWS Europe Central 1 (Frankfurt)** (non modifiable ensuite)
3. Sur le tableau de bord du projet → **Connect** :
   - désactive **Connection pooling** (connexion directe) ;
   - copie la **connection string** : `postgresql://…@….eu-central-1.aws.neon.tech/neondb?sslmode=require`
   → c'est **`DATABASE_URL`** (secret : elle contient le mot de passe).

Les tables sont créées automatiquement par l'API à son premier démarrage.

## 2. Stockage des documents — Backblaze B2

1. https://www.backblaze.com → **B2 Cloud Storage** → **Sign up**.
   ⚠️ Au moment de l'inscription, choisis la région **EU Central** : elle ne peut plus être changée ensuite.
2. **Buckets** → **Create a Bucket** :
   - Bucket name : unique au monde, par ex. `or-vault-docs-` suivi de quelques chiffres au hasard → **`S3_BUCKET`**
   - Files in Bucket are : **Private**
   - Default Encryption : **Enable**
   - Object Lock : **Disable**
3. Sur la carte du bucket → **Lifecycle Settings** → **Keep only the last version of the file** → **Update**.
   (L'API supprime de toute façon toutes les versions d'un fichier lors d'une suppression : purge totale.)
4. Sur la carte du bucket, note l'**Endpoint**, par ex. `s3.eu-central-003.backblazeb2.com` :
   - **`S3_ENDPOINT`** = `https://s3.eu-central-003.backblazeb2.com`
   - **`S3_REGION`** = `eu-central-003` (la partie entre `s3.` et `.backblazeb2.com`)
5. **Application Keys** → **Add a New Application Key** :
   - Name : `vault-api`
   - Allow access to Bucket(s) : **uniquement ton bucket**
   - Type of Access : **Read and Write**
   - **Create New Key**. La clé ne s'affiche **qu'une fois** :
     `keyID` → **`S3_ACCESS_KEY_ID`**, `applicationKey` → **`S3_SECRET_ACCESS_KEY`** (secret).

Formule gratuite : 10 Go stockés, et un quota quotidien de lectures. Largement suffisant pour des tests.

## 3. Compte de service Firebase en base64

Dans PowerShell, sur ton PC (le résultat s'affiche dans ton terminal uniquement) :

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:USERPROFILE\.vault-secrets\firebase-admin.json")) | Set-Clipboard
```

Le texte est copié dans le presse-papiers → c'est **`FIREBASE_SERVICE_ACCOUNT_BASE64`** (secret).
Garde aussi ton **`FIREBASE_PROJECT_ID`** (le même que dans `backend/.env`).

## 4. API — Render

1. https://render.com → **Get Started** → connecte-toi **avec GitHub**.
2. Autorise Render à accéder au dépôt **Casou-coder/objet-rare** (« Only select repositories »).
3. **New** → **Blueprint** → choisis le dépôt `objet-rare`, branche `master`.
   Render lit le fichier `render.yaml` et propose le service **vault-api** (Free, Frankfurt).
4. Remplis les 8 valeurs demandées avec celles notées plus haut :
   `DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_BASE64`,
   `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.
5. **Apply**. Le premier build prend environ 5 minutes (onglet **Logs**).
   À la fin : `Nest application successfully started`.
6. Note l'URL du service, par ex. `https://vault-api-xxxx.onrender.com`, et ouvre
   `https://vault-api-xxxx.onrender.com/health` dans ton navigateur : la réponse `{"status":"ok"}` confirme que tout marche.

Chaque `git push` sur `master` redéploie automatiquement l'API.

> Formule gratuite : l'API s'endort après 15 minutes sans requête ; la première requête suivante peut prendre
> jusqu'à 1 minute (l'app affiche alors le chargement, puis « Réessayer » si besoin).

## 5. Brancher l'app

1. Dans `app/.env` : `EXPO_PUBLIC_API_URL=https://vault-api-xxxx.onrender.com` (sans `/` final).
2. Relance Expo : `npx.cmd expo start --clear` dans `app`.
3. Dans Expo Go : connecte-toi, ajoute un objet avec une photo de certificat, ouvre le viewer, puis supprime l'objet.
   Vérifie dans Backblaze (**Browse Files**) que le fichier a bien disparu.

L'app fonctionne alors **même hors de ton Wi-Fi** (4G), et sans que ton PC soit allumé.

Pour revenir au backend local : remets `EXPO_PUBLIC_API_URL=http://192.168.1.33:3000`.

---

## En cas de problème

| Symptôme | Cause probable |
|---|---|
| Build Render en échec, `Démarrage impossible : AUTH_MODE=firebase : FIREBASE_PROJECT_ID est requis` | Variable manquante dans Render → **Environment**. |
| `Démarrage impossible : … illisible` | Le base64 du compte de service est tronqué : recopie-le. |
| Erreur de connexion à la base | `DATABASE_URL` incomplète (il faut `?sslmode=require` à la fin). |
| L'ajout d'un certificat échoue après l'envoi | Clé B2 sans accès au bucket, ou `S3_ENDPOINT` / `S3_REGION` incohérents. |
| L'app reste sur « Réessayer » | API endormie : patiente 1 minute puis réessaie. |

## Passer à une formule payante plus tard

Rien à changer dans le code : il suffit de changer de formule chez chaque service, ou de copier la base ailleurs
(`pg_dump` / `pg_restore`) et de mettre à jour les variables d'environnement.
