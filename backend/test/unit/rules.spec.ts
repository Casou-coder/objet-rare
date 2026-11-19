import { holderMatch, normalizeUniqueId } from '../../src/rules/normalize';
import { deriveProofStatus, documentStatus } from '../../src/rules/proof-status';
import { createItemSchema, deleteItemSchema, rawUniqueId } from '../../src/rules/schemas';

const base = {
  id: '3f1c2a8e-4b6d-4e8f-9a0b-1c2d3e4f5a6b',
  brand: 'Rolex',
  acquisition_price: { amount: 100, currency: 'EUR' },
  issuer_id: 'brand',
  certificate_type: 'card',
  declaration_accepted: true,
};

describe('normalisation des identifiants (T4)', () => {
  it('ignore casse, espaces et tirets', () => {
    expect(normalizeUniqueId(['ab-12 c'])).toBe(normalizeUniqueId(['AB12C']));
  });
  it('conserve les autres caractères', () => {
    expect(normalizeUniqueId(['AB/12'])).not.toBe(normalizeUniqueId(['AB12']));
  });
  it('compose la clé sneakers', () => {
    expect(normalizeUniqueId(['dd1391-100', '42', 'cmd 1'])).toBe('DD1391100|42|CMD1');
  });
});

describe('nominatif (Décisions A2)', () => {
  it('tolère casse, accents et ordre prénom/nom', () => {
    expect(holderMatch('M. DUPONT Clément', 'clement dupont')).toBe('match');
  });
  it('mismatch si le nom diffère', () => {
    expect(holderMatch('Paul Martin', 'Clément Dupont')).toBe('mismatch');
  });
  it('unknown si rien n’est détecté', () => {
    expect(holderMatch(null, 'Clément Dupont')).toBe('unknown');
  });
});

describe('schémas de validation par catégorie', () => {
  it('montre : numéro de série obligatoire, modèle facultatif (P3)', () => {
    expect(createItemSchema.safeParse({ ...base, category: 'watch', serial_number: 'X1' }).success).toBe(true);
    expect(createItemSchema.safeParse({ ...base, category: 'watch' }).success).toBe(false);
  });
  it('sac : code d’authenticité obligatoire', () => {
    expect(createItemSchema.safeParse({ ...base, category: 'handbag', auth_code: 'A1' }).success).toBe(true);
    expect(createItemSchema.safeParse({ ...base, category: 'handbag' }).success).toBe(false);
  });
  it('sneakers : modèle, SKU, taille et (commande ou ID certificat) obligatoires', () => {
    const ok = { ...base, category: 'sneaker', model: 'Dunk', sku: 'DD1391-100', size: '42', order_id: 'C1' };
    expect(createItemSchema.safeParse(ok).success).toBe(true);
    expect(createItemSchema.safeParse({ ...ok, order_id: undefined }).success).toBe(false);
    expect(createItemSchema.safeParse({ ...ok, order_id: undefined, certificate_external_id: 'G1' }).success).toBe(true);
    expect(createItemSchema.safeParse({ ...ok, model: undefined }).success).toBe(false);
  });
  it('prix d’acquisition obligatoire (P15)', () => {
    const { acquisition_price: _p, ...noPrice } = base;
    expect(createItemSchema.safeParse({ ...noPrice, category: 'watch', serial_number: 'X1' }).success).toBe(false);
  });
  it('déclaration de propriété obligatoire', () => {
    expect(createItemSchema.safeParse({ ...base, declaration_accepted: false, category: 'watch', serial_number: 'X' }).success).toBe(false);
  });
  it('refuse les catégories hors V1 (ex. bijoux)', () => {
    expect(createItemSchema.safeParse({ ...base, category: 'jewelry', serial_number: 'X' }).success).toBe(false);
  });
  it('identifiant composite sneakers utilise l’ID certificat à défaut de commande', () => {
    const p = createItemSchema.parse({ ...base, category: 'sneaker', model: 'Dunk', sku: 'S', size: '42', certificate_external_id: 'G1' });
    expect(rawUniqueId(p)).toEqual({ type: 'sneaker_composite', parts: ['S', '42', 'G1'] });
  });
  it('suppression : raison obligatoire, précision requise pour « autre »', () => {
    expect(deleteItemSchema.safeParse({}).success).toBe(false);
    expect(deleteItemSchema.safeParse({ reason: 'sold' }).success).toBe(true);
    expect(deleteItemSchema.safeParse({ reason: 'other' }).success).toBe(false);
    expect(deleteItemSchema.safeParse({ reason: 'other', free_text: 'x' }).success).toBe(true);
  });
});

describe('statuts de preuve (BUSINESS_RULES §6)', () => {
  const p = {
    hasCertificate: true,
    readabilityScore: 80,
    threshold: 65,
    holderNameDetected: 'Jean Dupont',
    holderMatch: 'match' as const,
    hasUniqueId: true,
    hasOpenConflict: false,
  };
  it('liste les statuts informatifs, jamais « authentifié »', () => {
    const s = deriveProofStatus(p);
    expect(s).toEqual(['certificate_provided', 'readability_sufficient', 'holder_detected', 'holder_confirmed', 'unique_id_registered']);
    expect(s.join()).not.toMatch(/authent/);
  });
  it('silence = OK : statut documentaire « complete »', () => {
    expect(documentStatus(p)).toBe('complete');
    expect(documentStatus({ ...p, readabilityScore: 40 })).toBe('unreadable');
    expect(documentStatus({ ...p, hasOpenConflict: true })).toBe('conflict');
  });
});
