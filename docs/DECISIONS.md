# Journal des décisions — Vault V1

Chaque entrée est datée, précise la version impactée et la source de la décision.
Règle (SOURCE_OF_TRUTH §4) : toute modification est datée, journalisée, et précise la version impactée.

Légende : **[P]** décision produit (prise par le responsable produit) · **[T]** décision technique interne (prise par Claude Code dans le périmètre autorisé du contrat d'intervention §4).

---

## 2026-11-19 — Décisions produit (version impactée : V1, backend 0.1.0 / app 0.2.0)

| # | Sujet | Décision | Remarque |
|---|---|---|---|
| P1 | Nom sur le certificat absent ou différent | **Jamais bloquant**. Statut visible sur le passeport (« Nominatif détecté » / « Nominatif confirmé » / non détecté). | Écart assumé avec CONTRAT PRODUIT §5.1 (« nominatif ») et CERTIFICATE_STANDARD_WATCH §3. |
| P2 | Nom et date sur un certificat de montre | **Recommandés**, non bloquants. | Écart assumé avec CERTIFICATE_STANDARD_WATCH §3. |
| P3 | Modèle obligatoire | **Sneakers uniquement**. | Conforme à ITEM_FORM et ITEM_VALIDATION_SCHEMAS. La mention « Modèle (obligatoire) » de la page Ajouter un objet est un exemple générique. |
| P4 | Limites Free en plus des 3 objets | Valeur actuelle visible, **historique limité aux 6 derniers points**, **1 assurance max par objet**, **aucun autre document**. | Premium : objets, documents et historique illimités, pas de publicité. |
| P5 | Modification après création | **Rien n'est modifiable**. Pour corriger : supprimer puis recréer. | `PATCH /items/{id}` est conservé (conformité OpenAPI) mais répond toujours `403 FORBIDDEN`. Pas d'écran « Modifier » dans l'app. |
| P6 | Moment de l'OCR | **Avant la création** : l'OCR préremplit le formulaire, l'utilisateur corrige puis confirme. | OCR non lancé si lisibilité < 65. L'OCR ne valide rien (OCR_EXTRACTION_CONTRACTS). |
| P7 | QR code scanné | Remplit **l'identifiant unique**, modifiable par l'utilisateur. | |
| P8 | Nom complet | **Écran dédié + `PUT /me`**. | `PUT /me` ajouté à l'OpenAPI. Ajout d'objet impossible tant que le nom est absent (Backlog US2.3). |
| P9 | Connexion | **Apple + Google + e-mail**, via Firebase Auth. | |
| P10 | Notification de conflit | **Reportée**. Le conflit est bloqué, le message neutre est affiché et le conflit est **enregistré en base** pour le support. Aucune notification envoyée en V1 pour l'instant. Aucun statut visible chez le premier propriétaire. | Écart assumé avec CONTRAT PRODUIT §5.4 et BUSINESS_RULES §5.2 (notification aux deux utilisateurs). À rebrancher plus tard. |
| P11 | Photos d'objet | **En V1, une photo principale facultative**, ajoutée pendant le flow d'ajout. | Non modifiable ensuite (cf. P5). |
| P12 | Document prioritaire | **SOURCE_OF_TRUTH** : Contrat produit > Business rules > UX flows > Data model > OpenAPI > Backlog > Décisions produit restantes. | Le README §3 est caduc sur ce point. |
| P13 | Stack | **Conforme au contrat** : NestJS + PostgreSQL + Firebase Auth + stockage S3 + RevenueCat. Supabase est abandonné. | L'app Expo existante est conservée pour l'interface. |
| P14 | Viewer de documents | **Certificat visible en Free** dans le viewer complet (zoom, rotation, pagination, plein écran). | Arbitre la contradiction CONTRAT §11 (« Premium ») / BUSINESS_RULES §7 (« accès complet au certificat »). |
| P15 | Prix d'acquisition | **Obligatoire** (montant + devise). | Conforme au Data model. |
| P16 | Fonctionnalités hors documents conservées | Publicités AdMob (Free uniquement), verrou biométrique, anti-capture d'écran sur le passeport, onboarding + choix de langue FR/EN. | |
| P17 | Fonctionnalités retirées (interdites) | Partage / export PDF du passeport, renommage de document, catégorie Bijoux, catégorie libre, champ « état », case « Authentifié », alertes d'expiration de garantie, centres d'intérêt. | CONTRAT §2, README §5 et §8, Page Documents §9. |
| P18 | Messages figés | Version **UX_FLOWS_V1 §3** : « Ce document n'est pas suffisamment lisible. » · « Ce certificat est déjà associé à un objet existant. » · « Un conflit d'unicité a été détecté. » · « Limite d'objets atteinte. Passez en Premium. » | |

### Points encore ouverts

- « Analyse détaillée par objet » (OFFRE PREMIUM) : non définie dans les documents, non implémentée.
- Fournisseur OCR et fournisseur de valeur de marché : à choisir (envoi de documents à un tiers).
- Notification de conflit (P10) : canal à choisir le jour où elle est réactivée.

---

## 2026-11-19 — Décisions techniques (version impactée : backend 0.1.0)

| # | Décision | Justification |
|---|---|---|
| T1 | TypeORM (DataSource + transactions) avec requêtes SQL explicites, migrations SQL versionnées (`backend/src/db/migrations`). | Contrat d'intervention §4.2. Les règles d'unicité restent lisibles dans le SQL. |
| T2 | Création en deux temps : un **brouillon** (`item_drafts`) porte le certificat et l'OCR ; l'objet (`items`) n'est inséré qu'à la confirmation finale, dans une transaction. Les brouillons ne sont jamais listés et sont purgés après 24 h. | L'OpenAPI impose `POST /items/{id}/certificate/upload-url` alors que Décisions A1 interdit un objet visible sans certificat confirmé. Le comportement observable reste celui des documents : aucun objet n'existe avant la confirmation. |
| T3 | Unicité garantie par **contraintes uniques PostgreSQL** (hash du certificat, couple type + valeur normalisée de l'identifiant), en plus des contrôles applicatifs. | Anti-contournement, y compris en cas de requêtes concurrentes. |
| T4 | Normalisation de l'identifiant unique : majuscules, espaces et tirets ignorés. Sneakers : clé composite `SKU|TAILLE|COMMANDE-ou-ID-CERTIFICAT`. | ITEM_VALIDATION_SCHEMAS §Sneakers. |
| T5 | Hash SHA-256 **recalculé côté serveur** depuis le fichier stocké (le hash client n'est qu'indicatif). | Empêche de contourner l'anti-doublon. |
| T6 | Score de lisibilité calculé côté serveur (sharp : résolution, netteté, contraste), seuil 65. | BUSINESS_RULES §3.2. |
| T7 | Limite Free appliquée **côté serveur** dans une transaction verrouillée sur l'utilisateur. Le plan est déterminé par le serveur (webhook RevenueCat), jamais par le client. | Contrat §3.2 : pas de contournement des limites Free. |
| T8 | URLs de documents présignées S3, durée 5 min. Aucun nom, hash, identifiant ni URL dans les logs. | Contrat §3.3. |
| T9 | Amendements de l'OpenAPI (formalisé dans `docs/openapi.yaml`) : `PUT /me` (P8), `POST /items/{id}/photo/upload-url` (P11), `GET /documents` (page Documents, évite N appels). `GET /items?view=collection` ne renvoie que image, nom et date (Page ma collection §3). | Endpoints ajoutés, aucun retiré. Codes d'erreur inchangés. |
| T10 | L'empreinte unique couvre aussi les documents liés (registre `file_hashes`) : un même fichier ne peut jamais être importé deux fois, certificat ou document (CONTRAT §5.2). Code `DUPLICATE_CERTIFICATE`, message « Ce document est déjà associé à un objet existant. » pour les documents. | Pas de nouveau code d'erreur. |
| T11 | Après une résiliation Premium, les documents au-delà des droits Free sont conservés mais renvoyés `locked: true`, sans URL (OFFRE PREMIUM §6 : « conserve les données, réapplique les limites Free »). | |
| T12 | Un accès à l'objet d'un autre utilisateur renvoie toujours `404 NOT_FOUND`, jamais `403`. | Ne révèle pas l'existence de l'objet. |

| T13 | Stockage de développement HTTP (`/dev-storage`, URLs signées HMAC, expirantes) quand `STORAGE_MODE=memory`, pour tester l'app sur téléphone sans S3. Jamais enregistré en production. Les fichiers sont perdus au redémarrage du backend. | Outil de dev uniquement. |
| T14 | App : client typé généré depuis `docs/openapi.yaml` (`openapi-typescript` + `openapi-fetch`, `npm run api:types`). Le cache TanStack Query n'est plus persisté sur l'appareil (données et URLs signées gardées en mémoire seulement). | Aucune donnée d'objet stockée en clair sur l'appareil. |
| T15 | Viewer : WebView + pdf.js ; le PDF est lu en mémoire (base64), jamais écrit sur l'appareil ; menu contextuel et sélection désactivés ; watermark = nom complet de l'utilisateur ; URL expirée → une régénération silencieuse. | CONTRAT §11, UX_FLOWS §2.4. |
| T16 | Le plan affiché par l'app vient de `GET /me` (serveur), plus du SDK RevenueCat côté client. | Anti-contournement (T7). |

### Points ouverts relevés pendant l'implémentation (2026-11-19)

- **Marque** : ITEM_FORM indique « Sélecteur », mais aucune liste de marques n'est définie. Saisie libre pour l'instant.
- **Liste « Autres objets certifiés »** : vide (aucun type défini). La catégorie s'affiche grisée.
- **CGU** : aucun document dans le dépôt. Le lien « Conditions d'utilisation » n'est pas affiché tant qu'il n'existe pas.
- **Support** : le bouton n'apparaît que si `EXPO_PUBLIC_SUPPORT_EMAIL` est renseigné (adresse à fournir).
- **Textes non spécifiés** : écrans Connexion, Compléter le profil, Suppression d'objet, et libellés de formulaire rédigés au plus sobre (`app/src/locales/v1.fr.ts`, textes non marqués `[doc]`). À valider.

- **PDF scannés** : un PDF sans couche texte obtient un score de lisibilité de 0 et est refusé (l'utilisateur peut photographier le document). Les pages ne sont pas encore rendues en image côté serveur. À valider.
- **« Valeur détaillée » (Premium)** : non définie. Free et Premium reçoivent aujourd'hui la même valeur actuelle.

---

## 2026-11-19 — Étape 4 : Firebase Auth (version impactée : backend 0.1.0 / app 0.2.0)

| # | Décision | Justification |
|---|---|---|
| T17 | App : **SDK JavaScript Firebase** (`firebase` 13) plutôt que `@react-native-firebase`. E-mail utilisable dans Expo Go ; Google (`@react-native-google-signin/google-signin`) et Apple (`expo-apple-authentication`) via `signInWithCredential`, actifs seulement dans les builds EAS (boutons masqués dans Expo Go). | Pas de fichier natif Firebase à gérer, tests rapides dans Expo Go. |
| T18 | Session Firebase persistée dans **SecureStore** (trousseau iOS / Keystore Android), découpée en morceaux de 1 800 caractères. | Aucun jeton en clair sur l'appareil (T14). |
| T19 | API : compte de service via `GOOGLE_APPLICATION_CREDENTIALS` (fichier hors dépôt, local) ou `FIREBASE_SERVICE_ACCOUNT_BASE64` (hébergement). Démarrage refusé si `AUTH_MODE=firebase` sans projet. Seul le code d'erreur de vérification est journalisé, jamais le jeton. | Contrat §3.3. |
| T20 | Mot de passe : 8 caractères minimum (app + règle Firebase). « Mot de passe oublié » répond toujours de façon neutre. Erreurs de connexion génériques, sans détail technique. | Pas d'énumération des comptes. Écrans `/login`, `/signup`, `/forgot-password` prévus par ARCHITECTURE §4. |
| T21 | Connexion de développement conservée **uniquement** si Firebase n'est pas configuré dans l'app **et** en mode développement ; l'API la refuse hors `AUTH_MODE=dev` (lui-même interdit en production). | Permet de continuer à tester sans projet Firebase. |

| # | Sujet | Décision | Remarque |
|---|---|---|---|
| P19 | Connexion Apple sur Android | **iOS uniquement**. Android : Google + e-mail. | Décision produit du 2026-11-19 (app 0.2.0). Déjà le comportement du code (`appleAvailable()`). |

### Points ouverts relevés à l'étape 4

- ~~**Apple sur Android**~~ : tranché, voir P19.
- **Révocation Apple à la suppression du compte** : Apple exige de révoquer le jeton « Sign in with Apple » quand un compte est supprimé. Il faut une seconde fenêtre Apple au moment de la suppression. À faire avant la soumission App Store (étape 6).
- **Vérification de l'adresse e-mail** : non spécifiée, non exigée pour l'instant.
- **Nom fourni par Apple** : non utilisé pour préremplir « Nom complet » (le profil reste saisi à la main).
