# Démarrage rapide dans VS Code

## Première fois (10 minutes)

### 1. Lancer le script d'installation

Ouvre **PowerShell** (clic droit sur le menu Démarrer → "Terminal" ou "PowerShell"), puis :

```powershell
cd "C:\Users\Clément\OneDrive\Documents\App objet rare\scripts"
pwsh -ExecutionPolicy Bypass -File install-windows.ps1
```

Si pwsh n'existe pas, utilise `powershell` à la place. Le script va installer :
- Node.js LTS
- Git
- VS Code
- pnpm
- Expo CLI + EAS CLI
- Toutes les extensions VS Code recommandées
- Les dépendances npm du projet

### 2. Créer tes comptes externes

Suis `docs/COMPTES_A_CREER.md` — tu n'as besoin que des **3 premiers** pour démarrer (Supabase, Expo, GitHub).

### 3. Remplir les variables d'environnement

```powershell
cd "C:\Users\Clément\OneDrive\Documents\App objet rare\app"
notepad .env
```

Colle ton URL et ta clé anon Supabase (récupérées dans Project Settings → API).

### 4. Ouvrir le projet dans VS Code

```powershell
code "C:\Users\Clément\OneDrive\Documents\App objet rare"
```

VS Code va te proposer d'installer les extensions recommandées → **clique "Installer tout"**.

### 5. Lancer l'app

Dans le terminal intégré de VS Code (`Ctrl+ù`) :

```powershell
cd app
pnpm start
```

Tu verras un **QR code**. Trois options pour le voir :
- 📱 **Téléphone Android** (recommandé) : installe l'app "Expo Go" depuis le Play Store, scanne le QR code → l'app se lance en live
- 💻 **Émulateur Android** : appuie sur `a` dans le terminal (nécessite Android Studio installé)
- 🌐 **Navigateur (preview rapide)** : appuie sur `w` (toutes les features natives ne marchent pas, mais c'est utile pour voir l'UI vite)

## Au quotidien

À chaque fois que tu reviens coder :

```powershell
cd "C:\Users\Clément\OneDrive\Documents\App objet rare\app"
code ..
pnpm start
```

Le hot reload est actif — chaque sauvegarde de fichier rafraîchit l'app instantanément.

## Raccourcis utiles dans Expo

Une fois `pnpm start` lancé :
- `a` — Ouvre sur Android (émulateur ou téléphone connecté en USB)
- `w` — Ouvre dans le navigateur
- `r` — Recharge l'app
- `j` — Ouvre les DevTools (debug JS)
- `m` — Toggle le menu dev
- `Ctrl+C` — Arrête le serveur

## Vérifications rapides

```powershell
# Vérifier le typage TypeScript
pnpm typecheck

# Vérifier le linter
pnpm lint

# Formater le code
pnpm format
```

## Problèmes courants

**"Cannot connect to dev server"** → vérifie que ton téléphone est sur le même Wi-Fi que ton PC. Sinon, lance `pnpm start --tunnel`.

**"EXPO_PUBLIC_SUPABASE_URL manquant"** → tu as oublié de remplir `.env`. Édite-le et relance `pnpm start`.

**Le QR code ne scanne pas** → l'app Expo Go doit être installée depuis le Play Store, pas un autre store.
