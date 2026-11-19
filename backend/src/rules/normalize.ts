/**
 * Normalisation des identifiants uniques (décision T4) :
 * casse, espaces et tirets ignorés. Les autres caractères sont conservés.
 */
export function normalizeIdPart(value: string): string {
  return value.normalize('NFKC').toUpperCase().replace(/[\s\-‐-―]/g, '');
}

export function normalizeUniqueId(parts: string[]): string {
  return parts.map(normalizeIdPart).join('|');
}

/** Normalise un nom pour comparaison tolérante (casse, accents, ponctuation). */
export function normalizeName(value: string): string[] {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Décisions produit restantes A2 : « Nominatif confirmé » si le texte détecté contient une
 * correspondance simple avec full_name (casse, accents, ordre prénom/nom).
 */
export function holderMatch(detected: string | null | undefined, fullName: string | null | undefined): 'match' | 'mismatch' | 'unknown' {
  if (!detected || !fullName) return 'unknown';
  const d = new Set(normalizeName(detected));
  const f = normalizeName(fullName);
  if (f.length === 0 || d.size === 0) return 'unknown';
  return f.every((token) => d.has(token)) ? 'match' : 'mismatch';
}
