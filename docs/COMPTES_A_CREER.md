# Comptes externes à créer

Voici la liste exhaustive des services à connecter pour faire tourner l'app, du strict minimum (MVP) à la version commerciale complète.

Pour tous ces services, utilise ton adresse **clement.dupas@hotmail.fr** comme identifiant principal et **AppStorage1234!$** comme mot de passe (à stocker aussi dans un gestionnaire — Bitwarden ou 1Password recommandés).

---

## 🟢 Indispensables pour démarrer (MVP)

### 1. Supabase — backend (auth, base de données, stockage, OCR)
- **Site** : https://supabase.com
- **Action** : créer un compte → "New Project" → région **Frankfurt (eu-central-1)** (RGPD)
- **À récupérer** après création (Settings → API) :
  - `URL` → à coller dans `app/.env` (`EXPO_PUBLIC_SUPABASE_URL`)
  - `anon public key` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Coût** : gratuit jusqu'à ~500 Mo de données + 1 Go de fichiers, largement suffisant pour le MVP.

### 2. Expo — build et déploiement de l'app
- **Site** : https://expo.dev
- **Action** : créer un compte → connecte-toi via `eas login` dans le terminal
- **À quoi ça sert** : générer l'APK Android, le distribuer en preview à tes testeurs, déployer sur le Play Store à terme
- **Coût** : gratuit pour le développement (limite de 30 builds/mois).

### 3. GitHub — versionnage du code (fortement recommandé)
- **Site** : https://github.com
- **Action** : créer un compte si tu n'en as pas → créer un repo privé "objet-rare"
- **À quoi ça sert** : sauvegarder ton code, suivre les modifs, CI/CD plus tard
- **Coût** : gratuit.

---

## 🟡 À ajouter dès qu'on attaque l'OCR

### 4. OpenAI — OCR sur les certificats et factures
- **Site** : https://platform.openai.com
- **Action** :
  1. Créer un compte → générer une clé API (`sk-...`)
  2. Stocker la clé en **secret Supabase** : `supabase secrets set OPENAI_API_KEY=sk-...`
  3. Déployer la Edge Function : `supabase functions deploy process-ocr`
  4. Appliquer le webhook SQL : `scripts/ocr-webhook.sql`
- **Coût** : ~0,003 $/image avec GPT-4o Vision.
- **Statut** : code prêt, déploiement à faire.

---

## 🟠 À ajouter pour le Premium (paiements)

### 5. RevenueCat — gestion des abonnements ✅ CONFIGURÉ
- **Site** : https://www.revenuecat.com
- **Projet** : "Rarity Locker" — Entitlement : "Rarity Locker Pro"
- **Offering** : `default` avec packages `$rc_monthly` / `$rc_annual` / `$rc_lifetime`
- **iOS key** : renseignée dans `.env` (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`)
- **Android key** : à renseigner (`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`) après création Google Play Console
- **Coût** : gratuit jusqu'à 2 500 $ MTR (Monthly Tracked Revenue).

### 6. Apple Developer Program — publier sur l'App Store
- **Site** : https://developer.apple.com
- **Coût** : **99 $/an**
- **Requis pour** : tester les achats In-App RevenueCat sur iOS, soumettre à l'App Store, obtenir l'`ascAppId` pour `eas.json`

### 7. Google Play Console — publier sur le Play Store
- **Site** : https://play.google.com/console
- **Coût** : **25 $** une seule fois (frais d'inscription développeur).
- **À faire** : quand l'app est prête à passer en bêta fermée.

---

## 🔵 Optionnels (analytics, monitoring, qualité)

### 7. PostHog — analytics et feature flags (RGPD friendly)
- **Site** : https://eu.posthog.com (région EU)
- **Coût** : gratuit jusqu'à 1M événements/mois.

### 8. Sentry — monitoring des erreurs
- **Site** : https://sentry.io
- **Coût** : gratuit jusqu'à 5 000 erreurs/mois.

### 9. Resend — emails transactionnels (confirmation compte, etc.)
- **Site** : https://resend.com
- **Coût** : gratuit jusqu'à 3 000 emails/mois.

---

## État actuel (2026-05-28)

| Service | Statut |
|---|---|
| Supabase | ✅ Configuré |
| Expo | ✅ Configuré |
| GitHub | À faire |
| OpenAI (OCR) | 🔧 Code prêt, déploiement à faire |
| RevenueCat | ✅ Configuré (iOS key renseignée) |
| Apple Developer | ❌ À créer ($99/an) — bloque les tests IAP iOS |
| Google Play Console | ❌ À créer ($25) — bloque les tests IAP Android |
| PostHog | ❌ Optionnel |
| Sentry | ❌ Optionnel |
| Resend | ❌ Optionnel |

## Ordre recommandé pour la suite

1. **Prochain** : Apple Developer Program → tester RevenueCat, soumettre App Store
2. **Puis** : déployer OCR (OpenAI key + `supabase functions deploy process-ocr`)
3. **Puis** : Google Play Console → distribution Android
4. **Quand on a du trafic** : Sentry + PostHog + Resend
