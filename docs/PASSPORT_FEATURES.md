# Passeport produit — features implémentées

## 1. Header & navigation

**Problème résolu** : le bandeau blanc avec la mention `(tabs)` dans le bouton retour.

**Solution** : header personnalisé dark avec flèche `<` simple sans label de route.

```
headerBackVisible: false
headerLeft: <ChevronLeft> → router.back()
headerStyle: bg #0B0B0F
```

Fichier : `app/src/app/item/[id].tsx`

---

## 2. Protection screenshot

**Comportement** :
- La page est protégée dès l'ouverture (`preventScreenCaptureAsync`)
- **Android** : le système bloque la capture nativement (écran noir) — aucune action de l'user n'est possible
- **iOS** : la capture est détectée après le fait → popup avec 2 options :
  1. **Face ID / Mot de passe** → authentification biométrique → accès temporaire 4 secondes
  2. **Télécharger le passeport PDF** → (futur) export officiel

**Packages** :
- `expo-screen-capture@55.0.14`
- `expo-local-authentication@55.0.14`

**Fichiers** :
- `app/src/features/passport/usePassportProtection.ts` — hook de protection
- `app/src/features/passport/ScreenshotModal.tsx` — modal de blocage

---

## 3. Section Certificat & documents

Dans le passeport, un bloc cliquable `Certificat & documents` :
- Icône cadenas → signale que c'est sécurisé
- Navigue vers `/(tabs)/coffre` filtré sur l'objet (`itemId` en param)
- Le coffre doit gérer ce filtre (à implémenter)

---

## 4. Catalogue objets de luxe

Fichier : `app/src/data/luxury-catalog.json`

**Marques référencées** :

| Catégorie | Marques |
|-----------|---------|
| Montres   | Rolex, Patek Philippe, Audemars Piguet, Richard Mille, Cartier |
| Sacs      | Hermès, Chanel, Louis Vuitton |
| Sneakers  | Nike (Jordan, Dunk, AF1), Adidas (Yeezy), New Balance |
| Bijoux    | Cartier (Love, JUN), Van Cleef & Arpels (Alhambra) |

**Structure de chaque entrée** :
```json
{
  "category": "watch|handbag|sneaker|other",
  "brand": "Rolex",
  "models": [
    { "ref": "116500LN", "name": "Cosmograph Daytona", ... }
  ],
  "certificate_fields": ["ref", "serial", "year", "condition", "box", "papers", ...]
}
```

**Usage prévu** :
- Autocomplétion dans le formulaire "Ajouter un objet"
- Pré-remplissage des champs de certificat selon la marque/modèle
- Affichage de la photo de référence associée (à brancher)

---

## À faire ensuite

- [ ] Upload de photos sur les items (Supabase Storage)
- [ ] Implémenter le coffre filtré par item
- [ ] Export PDF du passeport
- [ ] Photos de référence pour chaque modèle du catalogue
