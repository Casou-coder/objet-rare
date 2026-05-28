# Objet Rare

App mobile Android (React Native + Expo) — catalogue et passeport numérique pour objets de luxe.

## Documents clés

- **[docs/DEMARRAGE_VSCODE.md](docs/DEMARRAGE_VSCODE.md)** — comment installer et lancer l'app
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — stack, structure et choix techniques
- **[docs/COMPTES_A_CREER.md](docs/COMPTES_A_CREER.md)** — services à créer (Supabase, Expo…)
- **[app/](app/)** — le code de l'application
- **[scripts/install-windows.ps1](scripts/install-windows.ps1)** — script d'install automatique

## Specs produit (existantes)

Toutes les spécifications fonctionnelles sont dans les `.docx` à la racine de ce dossier :
- `SOURCE_OF_TRUTH.docx`
- `CONTRAT PRODUIT -V1.docx`
- `Data model logique final.docx`
- `Backlog technique complet.docx`
- `OpenAPI.docx`
- `BUSINESS_RULES_V1.docx`
- `UX_FLOWS_V1.docx`
- `ITEM_VALIDATION_SCHEMAS_V1.docx`
- `OCR_EXTRACTION_CONTRACTS_V1.docx`
- `OFFRE PREMIUM.docx`
- Plus les pages détaillées (Ma collection, Mon coffre, Passeport produit, etc.)
- Plus les Standards de certificats par catégorie (handbag, sneaker, watch, other)

> ⚠️ L'architecture proposée a été construite à partir des **titres** de ces fichiers. Une relecture détaillée est prévue pour ajuster `docs/ARCHITECTURE.md`.

## Démarrer en 3 commandes

```powershell
pwsh -ExecutionPolicy Bypass -File scripts/install-windows.ps1
cd app
pnpm start
```
