# Objet Rare — App mobile (React Native + Expo)

Application mobile Android de catalogue et passeport numérique pour objets de luxe (sacs, sneakers, montres, etc.) avec coffre-fort de documents, OCR de certificats et offre Premium.

## Démarrage rapide

1. **Installer les prérequis** (une seule fois) :
   ```powershell
   # Depuis PowerShell (en tant qu'admin la première fois pour winget)
   ../scripts/install-windows.ps1
   ```

2. **Ouvrir le projet dans VS Code** :
   ```powershell
   code .
   ```
   VS Code te proposera automatiquement d'installer les extensions recommandées (voir `.vscode/extensions.json`). Accepte.

3. **Configurer les variables d'environnement** :
   - Copie `.env.example` vers `.env`
   - Crée un projet Supabase (voir `../docs/COMPTES_A_CREER.md`)
   - Remplis `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`

4. **Installer les dépendances** :
   ```powershell
   pnpm install
   ```

5. **Lancer l'app en preview dans VS Code** :
   ```powershell
   pnpm start
   ```
   Puis :
   - **Android** : scanne le QR code avec l'app Expo Go sur ton téléphone, ou appuie sur `a` pour lancer l'émulateur Android
   - **Web (preview rapide dans VS Code)** : appuie sur `w`

## Architecture

Voir `../docs/ARCHITECTURE.md` pour le détail de la stack, la structure et les choix techniques.

## Structure des dossiers

```
app/
├── src/
│   ├── app/              # Routes (Expo Router, file-based routing)
│   │   ├── (auth)/       # Écrans non-authentifiés (login, signup)
│   │   ├── (tabs)/       # Navigation principale par onglets
│   │   │   ├── collection/   # Ma collection
│   │   │   ├── coffre/       # Mon coffre (documents)
│   │   │   ├── ajouter/      # Ajouter un objet
│   │   │   └── compte/       # Mon compte
│   │   ├── item/[id]/    # Passeport produit
│   │   └── _layout.tsx
│   ├── components/       # Composants UI réutilisables
│   ├── features/         # Logique métier par feature
│   │   ├── auth/
│   │   ├── items/        # Objets de la collection
│   │   ├── documents/    # Coffre numérique
│   │   ├── ocr/          # Extraction OCR
│   │   ├── certificates/ # Certificats (handbag, sneaker, watch, other)
│   │   └── premium/      # Abonnement Premium
│   ├── lib/              # Clients (supabase, ocr, storage)
│   ├── hooks/            # Hooks React partagés
│   ├── stores/           # State management (Zustand)
│   ├── types/            # Types TypeScript partagés
│   ├── utils/            # Helpers purs
│   └── theme/            # Couleurs, typo, espacements
├── assets/               # Images, polices
├── app.json              # Config Expo
├── package.json
├── tsconfig.json
└── .env.example
```
