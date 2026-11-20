# Design system — Vault V1

Référence visuelle de l'app. Elle décrit **ce qui est codé aujourd'hui** (`app/tailwind.config.js`,
`app/src/lib/theme.ts`, `app/src/components/ui.tsx`) et les règles tirées des documents produit
(pages d'écran, UX_FLOWS, OFFRE PREMIUM).

> Règle pour les agents : on **applique** ce design system, on ne le fait pas évoluer seul.
> Nouvelle couleur, nouveau composant partagé, changement de style d'un composant existant
> = décision de l'utilisateur, à journaliser dans `docs/DECISIONS.md`.

---

## 1. Principes

| Principe | Concrètement | Source |
|---|---|---|
| **Luxe sobre** | Fonds crème ou noir, or comme seule couleur d'accent, beaucoup d'espace, peu d'éléments par écran. | Palette du thème |
| **Factuel, jamais validant** | Pas de ✓ vert dominant, pas de badge « certifié », pas de wording de validation. L'app range des preuves, elle ne les garantit pas. | Page Passeport §Règles visuelles, Page ma collection |
| **Silence par défaut** | Un indicateur visuel n'apparaît **que si un problème existe** (action requise, conflit), et il reste discret. | Page ma collection |
| **Calme pendant l'attente** | Placeholders neutres, skeleton léger, pas de spinner plein écran bloquant. | Pages collection, coffre, documents, ajout |
| **Aucun dark pattern** | Paywall sobre, bouton secondaire « Continuer en version gratuite » discret mais visible, suppression avec confirmation explicite. | OFFRE PREMIUM, Page mon compte, Backlog EPIC 10 |
| **Ton** | Neutre, calme, explicatif, respectueux, transparent. Phrases courtes, pas de point d'exclamation, pas de superlatif. | OFFRE PREMIUM, Page mon compte |

---

## 2. Couleurs

Toujours via les classes Tailwind (`bg-ink`, `text-gold`…) ou `colors` de `@/lib/theme` quand une prop attend une
valeur (icônes, `ActivityIndicator`, barre d'onglets). **Jamais de code hexadécimal en dur dans un écran.**

| Jeton | Hex | Classe | Rôle |
|---|---|---|---|
| ink | `#0B0B0F` | `ink` | Texte principal (clair), fond de page (sombre), texte du bouton principal |
| ink-soft | `#1A1A22` | `ink-soft` | Cartes et champs (sombre) |
| ink-mute | `#3A3A45` | `ink-mute` | Texte secondaire (clair), bordures (sombre) |
| ink-gray | `#6B6B75` | — (`colors.inkGray`) | Placeholders de champ, onglets inactifs (sombre) |
| bone | `#F6F2EA` | `bone` | Fond de page (clair), texte principal (sombre) |
| bone-soft | `#EAE3D6` | `bone-soft` | Texte secondaire (sombre), fond du placeholder d'image (clair) |
| gold | `#B8975A` | `gold` | Accent unique : bouton principal, onglet actif, titres de section, sélection |
| gold-soft | `#D9B97A` | `gold-soft` | Réserve (non utilisé dans les écrans V1) |
| white | `#FFFFFF` | `white` | Cartes et champs (clair) |
| gray-100 / 200 | Tailwind | `gray-100`, `gray-200` | Placeholders (clair), bordures (clair) |
| red-500 | Tailwind | `red-500` | **Uniquement** erreurs de champ et action destructive |

`accent` (`#7A5BFF`) existe dans la config Tailwind mais **n'est pas utilisé en V1** : ne pas l'introduire.

Transparences admises : `bg-gold/10` (élément sélectionné), `border-gold/30` (encadré discret).

### Mode clair / sombre

Le thème suit le réglage de l'utilisateur (`darkMode: 'class'`, piloté par `usePreferences().theme`).
**Chaque couleur de fond, de texte ou de bordure a sa variante `dark:`.**

| Élément | Clair | Sombre |
|---|---|---|
| Fond d'écran | `bg-bone` | `dark:bg-ink` |
| Carte, champ | `bg-white border-gray-200` | `dark:bg-ink-soft dark:border-ink-mute` |
| Texte principal | `text-ink` | `dark:text-bone` |
| Texte secondaire | `text-ink-mute` | `dark:text-bone-soft` |
| Placeholder | `bg-gray-100` | `dark:bg-ink-soft` |

### ⚠️ Contraste à corriger (point ouvert)

`text-gold` sur fond `bone` ou blanc a un contraste d'environ **2,5:1**, sous le minimum WCAG AA (4,5:1 pour le petit texte).
Cela concerne les titres de section (`SectionTitle`), les puces sélectionnées et le bouton secondaire en mode clair.
En mode sombre (or sur `ink`, environ 7:1) et pour le bouton principal (texte `ink` sur fond or, environ 7:1), c'est conforme.
Correction à décider par l'utilisateur (par ex. or plus foncé pour le texte en mode clair).

---

## 3. Typographie

| Usage | Classes | Exemple |
|---|---|---|
| Titre d'écran | `font-serif text-3xl text-ink dark:text-bone` (composant `Title`) | « Ma collection » |
| Nom d'objet (passeport) | `font-serif text-3xl` | |
| Sous-titre de bloc | `font-serif text-xl` | Carte compte |
| Titre de section | `text-xs uppercase tracking-wider text-gold` (composant `SectionTitle`) | « VALEUR » |
| Texte courant | `text-base` (défaut) | |
| Libellé, aide | `text-sm` / `text-xs` + `text-ink-mute dark:text-bone-soft` | |
| Bouton | `font-semibold` (principal), `font-medium` (secondaire, danger) | |

Polices déclarées : `serif` = **PlayfairDisplay**, `sans` = **Inter**.
⚠️ **Elles ne sont pas encore chargées** (aucun fichier de police dans `app/assets`, pas de `useFonts`) : l'app affiche
aujourd'hui la police système. Les embarquer (`expo-font`) est un point ouvert.

Règles : le serif est réservé aux titres et aux noms d'objets ; jamais de texte en majuscules hors titres de section ;
montants formatés par `formatMoney` (sans décimales), dates par `formatDate`.

---

## 4. Espacements, formes, élévation

| Élément | Valeur |
|---|---|
| Marge latérale d'écran | `px-6` (formulaires, connexion), `px-5` (listes) |
| Espacement vertical courant | `mb-2`, `mb-3`, `mb-4`, `mt-6` entre sections, `mt-8` / `mb-8` autour d'un bloc principal |
| Grille | `gap-3` (12 px) ; collection en **2 colonnes** (cartes à 48 %) |
| Arrondis | cartes et images `rounded-2xl` (16 px) ; boutons et champs `rounded-xl` (12 px) ; puces et bouton flottant `rounded-full` |
| Hauteur des actions | bouton `py-4` ; bouton Apple 48 px ; bouton flottant 56 px (`h-14 w-14`) |
| Ombre | **uniquement** le bouton flottant « + » (`shadow-lg`). Les cartes ont une bordure fine, pas d'ombre. |
| Retour au toucher | `active:opacity-80` (boutons), `active:opacity-60` (liens) ; haptique légère via `@/lib/haptics` si besoin |

Zone tactile minimale : **44 × 44 px**.

---

## 5. Composants (`app/src/components/ui.tsx`)

Utilise ces composants avant d'écrire du style dans un écran.

| Composant | Usage | Règles |
|---|---|---|
| `Title` | Titre d'écran | Un seul par écran. |
| `SectionTitle` | Titre de bloc (passeport, compte, coffre) | Texte court, sans ponctuation. |
| `Card` | Regrouper un bloc d'information | Pas de carte dans une carte. |
| `Button` `primary` | **L'action principale de l'écran** (fond or, texte ink) | **Un seul** par écran. |
| `Button` `secondary` | Action alternative (bordure or) | « Réessayer », « Continuer avec Google ». |
| `Button` `danger` | Action destructive (bordure rouge) | Toujours précédée ou suivie d'une confirmation explicite (« Supprimer définitivement »). |
| `Button` `link` | Action discrète (retour, déconnexion, refus du paywall) | Doit rester lisible : pas de texte gris très clair. |
| `Field` | Champ de saisie avec libellé au-dessus | Libellé toujours visible ; `optional` pour « (facultatif) » ; erreur en rouge sous le champ. |
| `Chips` | Choix unique parmi peu d'options (catégorie, devise, tri) | Sélection : bordure or + `bg-gold/10`. |
| `ErrorState` | Échec de chargement | Message neutre + « Réessayer » (secondaire). |
| `EmptyState` | Liste vide | Message sobre + éventuelle action principale. |
| `Placeholders` | Chargement de liste ou de grille | Blocs neutres, sans animation agressive. |
| `ItemImage` | Photo d'objet | Sans photo : initiale en serif sur fond neutre, **jamais** d'image de produit externe. |
| `LockScreen` | Verrou biométrique | Plein écran, au-dessus de tout. |
| `BannerAd` | Publicité (Free uniquement, décision P16) | Aujourd'hui seulement sur Ma collection et Mon coffre. L'ajouter ailleurs = décision de l'utilisateur. |

Bouton Apple : composant officiel `AppleAuthenticationButton` (noir en clair, blanc en sombre, arrondi 12) ; ne pas le restyler.

---

## 6. Icônes

Bibliothèque **lucide-react-native**, trait fin, couleur passée en prop depuis `colors`.
Onglets : `GalleryVerticalEnd` (Ma collection), `Vault` (Mon coffre), `FileText` (Documents), `User` (Compte).
Taille : celle fournie par la barre d'onglets, 20 à 24 px ailleurs. Pas d'emoji dans l'interface.

---

## 7. Navigation et structure d'écran

- **4 onglets** : Ma collection, Mon coffre, Documents, Compte. Onglet actif en or, inactif en `ink-mute` (clair) ou `ink-gray` (sombre).
- **Bouton flottant « + »** en bas à droite de Ma collection, toujours visible, même pendant le chargement.
- Ajout d'objet : écrans en pile (`card`) ; suppression d'objet et de compte : `modal` ; viewer : `fullScreenModal`.
- Pas d'en-tête natif (`headerShown: false`) : chaque écran affiche son `Title` et, si besoin, un `Button link` de retour.

---

## 8. États d'écran

Chaque écran qui charge des données gère **4 états** :

| État | Rendu |
|---|---|
| Chargement | `Placeholders` (listes) ou petit `ActivityIndicator` or centré (aiguillage). Jamais de spinner bloquant long. |
| Erreur | `ErrorState` avec le message traduit (`useErrorMessage`) et « Réessayer ». |
| Vide | `EmptyState` avec le texte prévu par la page d'écran. |
| Normal | Contenu. |

Statuts d'un objet : affichés **seulement s'il y a un problème** (document manquant, illisible, conflit), en texte sobre,
sans couleur d'alerte vive ni icône de validation. Aucun statut visible chez le premier propriétaire en cas de conflit.

---

## 9. Contenu et textes

- Tout texte passe par i18n (`t('v.…')`), en FR et en EN avec les mêmes clés.
- Les textes marqués `// [doc]` dans `app/src/locales/v1.fr.ts` viennent des documents : **ne pas les reformuler**.
- Vocabulaire interdit (testé par `wording.test.ts`) : authentifié, certifié par, validé, expertisé, investissement,
  trading, partager, télécharger.
- Erreurs : neutres, sans détail technique, sans révéler l'existence d'un autre compte ou d'un autre objet.

---

## 10. Accessibilité

- `accessibilityRole="button"` sur tout élément pressable (déjà fait dans `Button`).
- Libellé visible sur chaque champ (pas de placeholder seul).
- Contraste AA visé : voir le point ouvert sur l'or en mode clair (§2).
- Tailles de texte : ne pas descendre sous `text-xs` ; ne pas bloquer l'agrandissement du texte système.

---

## 11. Points ouverts design

| Sujet | État |
|---|---|
| Contraste de l'or sur fond clair | À décider (§2) |
| Polices Inter / PlayfairDisplay non chargées | À embarquer (§3) |
| `gold-soft` et `accent` inutilisés | À garder en réserve ou à retirer |
| Charte graphique définitive (logo, icône d'app, splash) | Commentaire « à ajuster avec ta charte » dans `tailwind.config.js` |
