# Architecture — App Objet Rare

> Document vivant. Toute décision d'architecture s'écrit ici en premier, le code suit.

## 1. Vue d'ensemble

App mobile Android (Expo / React Native) permettant aux propriétaires d'objets de luxe (sacs, sneakers, montres, autres) de :
- cataloguer leur collection avec un **passeport produit** numérique par item
- stocker leurs documents (factures, certificats d'authenticité) dans un **coffre-fort numérique**
- extraire automatiquement les infos clés des documents par **OCR**
- débloquer des fonctionnalités avancées via une **offre Premium** (freemium)

## 2. Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework mobile | **React Native + Expo (SDK 54)** | Multi-plateforme, build managé, ergonomique sous VS Code |
| Routing | **Expo Router** (file-based) | Convention claire, deep-links natifs, SSR web possible |
| Langage | **TypeScript** strict | Sécurité, autocomplétion sur l'OpenAPI |
| State management | **Zustand** + **TanStack Query** | Zustand pour l'état UI léger, React Query pour la donnée serveur (cache, sync, optimistic updates) |
| UI | **NativeWind** (Tailwind RN) + composants custom | Cohérent avec ton CONTRAT PRODUIT, productif |
| Backend / DB | **Supabase** (Postgres + Auth + Storage + Edge Functions) | Open source, évolutif, scale-out facile, conforme RGPD (région EU possible) |
| OCR | **Supabase Edge Function** → OpenAI Vision | Découplé du client, factorisable, sécurisé (clé serveur uniquement) |
| Paiements Premium | **RevenueCat** | Abstrait Google Play & App Store, mesure churn / conversion |
| Notifications | **Expo Push** | Native à la stack Expo |
| Analytics | **PostHog** (self-host possible) | RGPD friendly |
| Tests | **Jest** + **React Native Testing Library** + **Detox** (E2E plus tard) | Standard de la stack |
| CI/CD | **EAS Build** + **GitHub Actions** | Builds cloud Android, déploiement à terme sur Play Store |
| Lint / format | **ESLint** + **Prettier** + **Husky** + **lint-staged** | Hygiène automatique avant commit |

### Pourquoi Supabase plutôt que Firebase

- **Postgres natif** → le data model relationnel de ton `Data model logique final.docx` se traduit 1-1, pas de gymnastique NoSQL
- **Row Level Security** → règles métier appliquées au niveau SQL, pas duplicables/contournables côté client
- **OpenAPI auto-généré** → cohérent avec ton fichier `OpenAPI.docx`
- **Storage** avec signed URLs pour le coffre (documents privés, accès temporaires)
- **Self-host possible** quand tu scaleras
- **Coût** : free tier confortable, pas de surprise

## 3. Modèle de données (hypothèse — à valider avec ton `Data model logique final.docx`)

```
profiles                 (1-1 avec auth.users)
  id (uuid, PK = auth.users.id)
  email, full_name, avatar_url
  plan (enum: free | premium)
  premium_expires_at
  created_at

items                    (les objets de la collection)
  id (uuid, PK)
  owner_id (FK profiles.id)
  category (enum: handbag | sneaker | watch | other)
  brand, model, name
  serial_number
  purchase_date, purchase_price, purchase_currency
  condition (enum: mint | excellent | good | fair | poor)
  is_authenticated (bool)
  metadata (jsonb)        # champs spécifiques à la catégorie
  created_at, updated_at

item_photos
  id, item_id (FK), url, position, is_cover

documents                (le coffre — factures, certificats)
  id (uuid, PK)
  owner_id (FK profiles.id)
  item_id (FK items.id, nullable)   # rattachable à un objet
  type (enum: invoice | certificate | warranty | other)
  storage_path           # chemin Supabase Storage (bucket privé)
  ocr_status (enum: pending | done | failed)
  ocr_data (jsonb)       # extractions structurées
  created_at

certificates             (certificats émis par l'app — passeport produit)
  id, item_id (FK), category, payload (jsonb), pdf_url, issued_at

ocr_jobs                 (jobs OCR async)
  id, document_id (FK), status, error, provider, started_at, finished_at

subscriptions            (état Premium synchronisé depuis RevenueCat)
  user_id (FK), product_id, status, expires_at, store
```

Tous les accès passent par **RLS** : un user ne peut lire/écrire que ses propres lignes.

## 4. Navigation

```
(auth)
  /login
  /signup
  /forgot-password

(tabs)                           # Tab bar principal
  /collection       → Ma collection (liste, filtres par catégorie)
  /coffre           → Mon coffre (documents, factures, certificats)
  /ajouter          → Ajouter un objet (action centrale, FAB)
  /compte           → Mon compte (profil, plan, paramètres)

/item/[id]          → Passeport produit (détail d'un item)
/item/[id]/edit
/item/new           → Création d'un objet (category param)
/document/[id]      → Détail d'un document du coffre
/premium            → Paywall offre Premium (RevenueCat)
/privacy-policy     → Politique de confidentialité (RGPD)
/tutorial           → Guide d'utilisation
```

## 5. Découpage en features

Chaque feature est autonome, avec ses écrans, ses hooks, ses appels Supabase, ses types :

```
features/
  auth/         signIn, signUp, signOut, useSession()
  items/        useItems(), useItem(id), createItem(), updateItem(), itemSchemas par catégorie
  documents/    uploadDocument(), useDocuments(), useDocument(id)
  ocr/          enqueueOcrJob(), useOcrResult()
  certificates/ generateCertificate(), useCertificate(id)
  premium/      usePlan(), upgradeToPremium(), revenueCatClient
```

Cette séparation **par feature** (et pas par type de fichier) permet de bouger une feature entière sans casser le reste.

## 6. Gestion de l'état

- **Données serveur** → TanStack Query (cache, retry, invalidation). Une mutation Supabase = un `invalidateQueries` ciblé.
- **Auth / session** → Zustand store + écouteur `onAuthStateChange` Supabase
- **UI éphémère** (modal ouverte, filtres) → `useState` local
- **Préférences user** (thème, langue) → Zustand + persistance via `AsyncStorage`

## 7. Sécurité

- RLS Supabase obligatoire sur toutes les tables (deny-by-default) — `owner_id = auth.uid()` sur `items`
- `owner_id` injecté depuis le Zustand auth store (mémoire, pas de réseau) lors du `createItem()`
- Documents du coffre stockés en bucket **privé**, accédés via **signed URLs** courte durée (5 min)
- Clés sensibles uniquement côté serveur (Edge Functions) — jamais dans le bundle mobile
- Mots de passe : Supabase Auth (Argon2 côté serveur)
- Pas de token dans `localStorage` web — `SecureStore` (Expo) sur mobile
- Déverrouillage biométrique via `expo-local-authentication` — données biométriques jamais transmises
- HTTPS partout, certificate pinning sur les builds de prod (post-MVP)

## 8. Offline-first (post-MVP)

- TanStack Query gère un cache local
- À terme : queue d'actions offline (création d'item sans réseau → sync différée)
- Coffre : documents téléchargés mis en cache local chiffré

## 9. CI/CD

- **GitHub Actions** : lint + typecheck + tests sur chaque PR
- **EAS Build** : preview build (APK interne) sur chaque merge en `main`
- **EAS Submit** : déploiement Play Store quand tagué `v*.*.*`

## 10. Ce qu'il reste à valider avec tes specs

> J'ai construit cette archi à partir des **noms** de tes documents Word. Une fois mon environnement Linux disponible, je relirai chaque `.docx` et marquerai ici les ajustements nécessaires.

Points à confirmer :
- [ ] Schéma exact de `Data model logique final.docx` vs mon modèle ci-dessus
- [ ] Contrats OCR (`OCR_EXTRACTION_CONTRACTS_V1.docx`) → mapper sur `documents.ocr_data`
- [ ] Schémas de validation (`ITEM_VALIDATION_SCHEMAS_V1.docx`) → Zod schemas par catégorie
- [ ] Endpoints OpenAPI vs Supabase auto-API : faut-il un BFF (Backend For Frontend) ?
- [ ] Régles `BUSINESS_RULES_V1.docx` : où vivent-elles (RLS / Edge Functions / client) ?
- [ ] Périmètre exact de l'offre Premium (`OFFRE PREMIUM.docx`)
- [ ] Contenu d'un Passeport Produit (`Page Passeport produit.docx`)
