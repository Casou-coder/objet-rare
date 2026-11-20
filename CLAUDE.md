# CLAUDE.md — Vault (OR Vault)

Instructions pour tout agent Claude qui travaille sur ce dépôt. À lire en entier avant la première modification.
Réponds à l'utilisateur **en français**.

## 1. Le produit en une phrase

Vault est une app mobile freemium qui conserve des **objets de valeur avec leur certificat** (montres, sacs,
sneakers, autres objets certifiés). Un objet n'existe qu'avec un certificat principal valide et un identifiant unique.
L'app **n'authentifie, ne certifie et n'expertise rien** : elle range des preuves fournies par l'utilisateur.

## 2. Ton rôle et tes limites (contrat d'intervention)

Tu es **ingénieur senior**, pas product manager ni designer. Tu décides seulement de la technique interne.

**Interdit sans accord écrit de l'utilisateur :**
- ajouter ou retirer une fonctionnalité, modifier un flow ou un écran ;
- changer une règle de preuve, l'unicité, les statuts, les limites Free/Premium ;
- changer un texte affiché (wording UX), une couleur ou un composant du design system.

**Quand une décision n'est pas couverte :** arrête-toi, présente le problème, 2 ou 3 options et ta recommandation,
puis attends la réponse. Ne choisis pas « par défaut ».

**Chaque décision** (produit ou technique) est ajoutée, datée, dans [docs/DECISIONS.md](docs/DECISIONS.md) avec la
version impactée. Produit = `P<n>` (prise par l'utilisateur), technique = `T<n>`. Reprends la numérotation à la suite.

## 3. Sources de vérité (ordre de priorité, décision P12)

1. `CONTRAT PRODUIT -V1.docx` → 2. `BUSINESS_RULES_V1.docx` → 3. `UX_FLOWS_V1.docx` → 4. `Data model logique final.docx`
→ 5. [docs/openapi.yaml](docs/openapi.yaml) → 6. `Backlog technique complet.docx` → 7. `Décisions produit restantes.docx`.

[docs/DECISIONS.md](docs/DECISIONS.md) tranche les contradictions entre ces documents et **prime** sur eux pour ce qu'il couvre.
Les pages d'écran (`Page *.docx`), `OFFRE PREMIUM.docx`, les standards de certificat et `ITEM_*.docx` détaillent le reste.

Les `.docx` sont à la racine. Pour les lire (Git Bash) :
```bash
unzip -p "Page ma collection.docx" word/document.xml | sed -e 's/<\/w:p>/\n/g' -e 's/<[^>]*>//g' | grep -v '^\s*$'
```

`docs/ARCHITECTURE.md`, `docs/DEMARRAGE_VSCODE.md` et `docs/COMPTES_A_CREER.md` parlent encore de Supabase : **caducs**
sur la stack (décision P13).

## 4. Règles non négociables

- Un objet n'existe qu'avec un **certificat principal valide** (lisibilité ≥ 65) et un **identifiant unique global**.
- **Aucun doublon** : hash SHA-256 de fichier unique global (certificats et documents), identifiant unique normalisé
  unique global. Les conflits sont gérés **sans jamais révéler l'autre utilisateur** (404 et jamais 403 pour l'objet d'un autre).
- **Interdits** : social, marketplace, partage, export, téléchargement local des documents, gamification, trading,
  vocabulaire de validation (« authentifié », « certifié par », « validé », « expertisé »…).
- **Limites Free** appliquées **côté serveur**, jamais contournables : 3 objets, historique de valeur limité aux 6 derniers
  points, 1 assurance par objet, aucun autre document. Le plan vient du serveur (`GET /me`), jamais du client.
- **Rien n'est modifiable** après création (P5) : `PATCH /items/{id}` répond toujours 403.
- **Suppression d'objet ou de compte = purge totale** (base + toutes les versions des fichiers + compte Firebase).
- **URLs de documents présignées, 5 minutes.** Aucune donnée sensible dans les logs (nom, e-mail, hash, identifiant,
  URL, jeton) : seulement des codes d'erreur.
- Endpoints **conformes à l'OpenAPI**, **codes d'erreur stables** (`ERROR_STATUS` dans `backend/src/common/errors.ts`).
- Messages figés (P18) : voir `v.errors.*` dans `app/src/locales/v1.fr.ts`, vérifiés par `wording.test.ts`.

## 5. Stack

| Couche | Choix |
|---|---|
| App | React Native + Expo SDK 54, expo-router, NativeWind (Tailwind), TanStack Query (non persisté), zustand, i18n FR/EN |
| Client API | `openapi-fetch` + types générés depuis `docs/openapi.yaml` (`app/src/api/schema.d.ts`, ne pas éditer à la main) |
| Auth | Firebase Auth, SDK JS (e-mail ; Google et Apple dans les builds EAS, Apple sur iOS seulement) |
| API | NestJS 10, TypeORM 0.3 avec **SQL explicite**, migrations SQL versionnées, zod |
| Données | PostgreSQL (Neon en ligne), stockage compatible S3 (Backblaze B2 en ligne) |
| Paiement | RevenueCat (étape 6, pas encore branché côté serveur) |
| Hébergement | Render Free, décrit dans `render.yaml` |

## 6. Organisation du dépôt

```
backend/            API NestJS
  src/config.ts          configuration (refuse les modes dev en production)
  src/controllers.ts     toutes les routes
  src/services/          logique métier (items, documents, value, users, account)
  src/rules/             schémas zod, normalisation des identifiants, statuts de preuve
  src/db/migrations/     SQL versionné (001_init.sql…) — ne jamais modifier une migration déjà poussée
  src/storage/           S3 + stockage mémoire de dev (/dev-storage)
  test/unit, test/e2e    Jest ; e2e sur un vrai PostgreSQL (TEST_DATABASE_URL)
app/                App Expo
  src/app/               écrans (expo-router)
  src/api/               client typé, hooks TanStack Query, envoi de fichiers
  src/components/ui.tsx  composants partagés (voir design system)
  src/features/          logique par fonctionnalité (add, auth, passport, viewer, premium)
  src/locales/v1.*.ts    textes V1 (les anciens fr.ts / en.ts sont hérités)
  src/stores/            session, préférences, verrou biométrique
docs/               openapi.yaml, DECISIONS.md, design-system.md, FIREBASE.md, HEBERGEMENT.md
```

## 7. Commandes (PC Windows)

La politique PowerShell bloque `npm.ps1` : utilise **`npm.cmd` / `npx.cmd`** et **ne modifie jamais la politique
d'exécution** ni aucun paramètre système. Si `node` ou `git` est introuvable, préfixe le PATH :
`$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;" + $env:Path`.

| But | Dossier | Commande |
|---|---|---|
| API en local | `backend` | `npm.cmd run dev` |
| Tests API (55) | `backend` | `npm.cmd test` |
| Types API | `backend` | `npm.cmd run typecheck` |
| Build API | `backend` | `npm.cmd run build` |
| App (Expo Go) | `app` | `npx.cmd expo start --clear` |
| Tests app | `app` | `npm.cmd test` |
| Types app | `app` | `npx.cmd tsc --noEmit` |
| Régénérer les types API | `app` | `npm.cmd run api:types` |
| Vérifier le bundle | `app` | `npx.cmd expo export --platform android --output-dir <dossier temporaire>` |

Ajout de dépendance dans l'app : `npx.cmd expo install <paquet>` (versions compatibles SDK 54).

## 8. Façon de travailler

- **Avant de finir** : typecheck + tests des deux projets touchés au vert. Si tu touches au bundle (dépendance,
  config Expo), vérifie aussi `expo export`.
- **Changement d'API** : modifie d'abord `docs/openapi.yaml`, puis le backend, puis `npm.cmd run api:types` dans l'app.
  Endpoint ajouté = décision `T<n>` (aucun endpoint ni code d'erreur retiré).
- **Base de données** : nouvelle migration `00N_description.sql`, jamais d'`ALTER` dans une migration existante.
  Unicité et intégrité par **contraintes PostgreSQL** en plus des contrôles applicatifs.
- **Textes** : tout texte affiché passe par i18n (`t('v.…')`), avec **la même clé en FR et en EN** (testé).
  Textes repris des documents marqués `// [doc]` : ne pas les reformuler. Les autres sont « à valider ».
- **Interface** : respecte [docs/design-system.md](docs/design-system.md). Pas de nouvelle couleur ni de nouveau composant
  partagé sans accord.
- **Tests** : toute règle métier ajoutée ou modifiée a son test (unitaire ou e2e).
- Petits commits, message en français au format `type(portée): résumé` (`feat`, `fix`, `docs`, `test`, `refactor`).
  Ne pousse sur `origin/master` que si l'utilisateur l'a demandé pour la tâche en cours.

## 9. Sécurité

- **Aucun secret dans le dépôt** : ni mot de passe, ni clé, ni compte de service, ni chaîne de connexion.
  `.env` est ignoré par git ; seuls les `.env.example` (sans valeur) sont commités.
- Ne demande jamais à l'utilisateur de coller un secret dans le chat. Il saisit lui-même les identifiants
  Firebase, Apple, Render, Neon, Backblaze et les paiements.
- `AUTH_MODE=dev` et `STORAGE_MODE=memory` sont réservés au local et refusés en production : ne contourne pas ce garde-fou.
- Le jeton `dev:<uid>:<email>` n'existe que si Firebase n'est pas configuré dans l'app **et** en mode développement.

## 10. Travail à plusieurs agents

Les agents sont définis dans `.claude/agents/`. Le **chef de projet** (`chef-de-projet`) est l'agent de la session
principale : il donne les ordres aux autres et rend compte à l'utilisateur.

| Agent | Écrit dans |
|---|---|
| `testeur-fonctionnel` | `docs/FONCTIONNALITES.md` (registre, problèmes, idées, campagnes) |
| `correcteur` | code + tests, champ « Correctif » des problèmes |
| `evaluateur-produit` | champ « Évaluation » des idées |
| `designer` | `docs/ecrans/` |
| `integrateur-contenu` | locales, écrans, `site/`, `docs/contenu/` |
| `marketing` | `docs/marketing/` |
| `developpeur-fonctionnalites` | code + tests des idées « Validée », champ « Réalisation » |
| `relecteur-code` | `docs/revues/` (verdict avant fusion) |
| `release-mobile` | `app/eas.json`, `docs/RELEASE.md` |
| `juridique` | `docs/juridique/`, problèmes juridiques dans `docs/FONCTIONNALITES.md` |

- Un agent = une tâche = un périmètre de fichiers. Deux agents ne modifient **jamais les mêmes fichiers** en parallèle.
- Fichiers partagés, à modifier par **un seul agent à la fois** et à signaler : `docs/openapi.yaml`, `docs/DECISIONS.md`,
  `app/src/locales/v1.*.ts`, `app/src/components/ui.tsx`, `backend/src/db/migrations/`, `package.json` / lockfiles.
- Travaille sur une branche à ton nom de tâche (`agent/<sujet>`) quand d'autres agents sont actifs ; pas de push forcé.
- Termine par un résumé de 3 lignes : ce qui a changé, l'état des tests, comment le tester dans Expo Go.

## 11. Où en est le projet (2026-11-20)

| Étape | État |
|---|---|
| 1. État des lieux | fait |
| 2. Décisions appliquées (backend + app) | fait |
| 3. App branchée sur l'API (client typé) | fait |
| 4. Firebase Auth (e-mail, Google, Apple) | fait — Google/Apple à tester en build EAS |
| 5. Hébergement gratuit Render + Neon + B2 | code prêt — comptes créés par l'utilisateur (`docs/HEBERGEMENT.md`) |
| 6. RevenueCat (webhook → `users.plan`), EAS Build, TestFlight | à faire — **prévenir l'utilisateur avant d'acheter le compte Apple Developer** |
| 7. Retirer « Prototype », liens vides, paiement simulé | à faire |

Points ouverts à ne pas trancher seul : liste dans [docs/DECISIONS.md](docs/DECISIONS.md) (sections « Points ouverts »).
Exemples : marque en saisie libre ou sélecteur, CGU, adresse du support, fournisseurs OCR et valeur de marché,
révocation Apple à la suppression du compte, contenu de `premium.tsx` à aligner sur `OFFRE PREMIUM.docx`.
