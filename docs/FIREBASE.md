# Créer le projet Firebase — guide pas à pas (PC Windows)

Durée : environ 15 minutes pour l'e-mail. Google et Apple viennent plus tard (voir parties 6 et 7).
Tu saisis toi-même tous les identifiants. **Rien de ce qui suit ne doit être commité** : les valeurs vont dans
`app/.env` et `backend/.env`, qui sont ignorés par git.

---

## 1. Créer le projet

1. Ouvre https://console.firebase.google.com et connecte-toi avec le compte Google du projet.
2. **Créer un projet** → nom : `or-vault` (l'ID proposé, par ex. `or-vault-1a2b3`, est ton *Project ID* : note-le).
3. **Google Analytics** : désactive-le (non prévu par les documents ; tu pourras l'activer plus tard).
4. **Créer le projet**, puis **Continuer**.

## 2. Activer la connexion par e-mail

1. Menu de gauche → **Créer** → **Authentication** → **Commencer**.
2. Onglet **Mode de connexion** → **E-mail/Mot de passe** → active **la première option uniquement**
   (laisse « Lien envoyé par e-mail » désactivé) → **Enregistrer**.
3. Onglet **Paramètres** :
   - **Règles relatives aux mots de passe** : active l'application, longueur minimale **8** (comme l'app).
   - **Protection contre l'énumération des adresses e-mail** : laisse-la **activée**.
4. Onglet **Modèles** → icône crayon d'un modèle → **Langue du modèle** : Français.
   L'app choisit ensuite la langue de l'utilisateur (FR ou EN) à chaque envoi.

## 3. Récupérer la configuration de l'app

1. Roue dentée en haut à gauche → **Paramètres du projet** → onglet **Général**.
2. En bas, **Vos applications** → icône **`</>`** (Web) → surnom : `Vault app` → ne coche pas Hosting → **Enregistrer l'application**.
3. Firebase affiche un bloc `firebaseConfig`. Copie 4 valeurs dans **`app/.env`** :

```
EXPO_PUBLIC_FIREBASE_API_KEY=<apiKey>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<authDomain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<projectId>
EXPO_PUBLIC_FIREBASE_APP_ID=<appId>
```

> L'`apiKey` Firebase n'est pas un secret (elle identifie le projet), mais elle reste hors du dépôt.

## 4. Donner à l'API le droit de vérifier les connexions

L'API a besoin d'un **compte de service** (c'est, lui, un vrai secret).

1. **Paramètres du projet** → onglet **Comptes de service** → **Générer une nouvelle clé privée** → **Générer la clé**.
   Un fichier `or-vault-…-firebase-adminsdk-….json` est téléchargé.
2. Crée le dossier `C:\Users\<toi>\.vault-secrets\` (**en dehors** du dossier `objet-rare`) et déplace le fichier dedans,
   renommé `firebase-admin.json`. Ne l'envoie à personne, ne le colle nulle part.
3. Dans **`backend/.env`**, remplace la ligne `AUTH_MODE=dev` et complète :

```
AUTH_MODE=firebase
FIREBASE_PROJECT_ID=<projectId>
GOOGLE_APPLICATION_CREDENTIALS=C:\Users\<toi>\.vault-secrets\firebase-admin.json
```

> En cas de fuite du fichier : Comptes de service → Google Cloud → supprime la clé, puis génères-en une nouvelle.

## 5. Tester dans Expo Go

1. Arrête puis relance l'API (`npm.cmd run dev` dans `backend`) et Expo (`npx.cmd expo start --clear` dans `app`).
2. Dans Expo Go : écran **Connexion** → **Créer un compte** → e-mail + mot de passe (8 caractères minimum).
3. Vérifie dans la console Firebase → Authentication → **Utilisateurs** : ton compte apparaît.
4. Teste aussi **Mot de passe oublié ?** : l'e-mail arrive (regarde les spams la première fois).
5. **Compte → Supprimer mon compte** : l'utilisateur disparaît aussi de la console Firebase.

Les boutons **Apple** et **Google** n'apparaissent pas dans Expo Go : c'est normal (modules natifs).

> L'app et l'API doivent être dans le même mode : Firebase renseigné dans `app/.env` ⇔ `AUTH_MODE=firebase`.
> Pour revenir à la connexion de développement, vide les 4 lignes `EXPO_PUBLIC_FIREBASE_*` et remets `AUTH_MODE=dev`.

---

## 6. Google (plus tard, avec un build EAS)

1. Authentication → Mode de connexion → **Google** → **Activer** → adresse e-mail d'assistance → **Enregistrer**.
2. Rouvre **Google** → **Configuration du SDK Web** → copie l'**ID client Web** dans
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
3. **Paramètres du projet** → **Ajouter une application** → **iOS** → ID de bundle `app.orvault` → enregistre.
   Dans le fichier `GoogleService-Info.plist` proposé, copie la valeur `CLIENT_ID` dans `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   (inutile de garder le fichier).
4. **Ajouter une application** → **Android** → nom de package `app.orvault` → empreinte **SHA-1** du certificat de signature
   (donnée par `eas credentials` une fois le premier build Android créé ; je te guiderai à l'étape 6).
5. Ces deux variables doivent aussi être déclarées dans EAS (`eas env:create`) : je le ferai avec toi à l'étape 6.

## 7. Apple (après l'achat du compte Apple Developer)

1. developer.apple.com → Identifiers → `app.orvault` → coche **Sign in with Apple**.
2. Firebase → Authentication → Mode de connexion → **Apple** → **Activer** → **Enregistrer**
   (pour une app iOS native, aucun « Services ID » n'est nécessaire).
3. Le bouton « Continuer avec Apple » apparaît automatiquement dans les builds iOS.

---

## Hébergement (étape 5)

En production, l'hébergeur ne lit pas de fichier : encode le JSON du compte de service en base64
(`[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\Users\<toi>\.vault-secrets\firebase-admin.json"))` dans PowerShell)
et colle le résultat dans la variable **secrète** `FIREBASE_SERVICE_ACCOUNT_BASE64` de l'hébergeur.
