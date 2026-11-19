jest.mock('expo-crypto', () => ({ randomUUID: () => '3f1c2a8e-4b6d-4e8f-9a0b-1c2d3e4f5a6b' }));

import { buildCreateItem, uniqueIdField } from '@/features/add/draft';

const base = { draftId: '3f1c2a8e-4b6d-4e8f-9a0b-1c2d3e4f5a6b', photo: null };
const common = { brand: 'Rolex', price: '9500', currency: 'EUR', issuer_id: 'brand', certificate_type: 'card' };

describe('buildCreateItem — règles par catégorie (miroir des schémas serveur)', () => {
  it('montre : numéro de série obligatoire, modèle facultatif (P3)', () => {
    expect(buildCreateItem({ ...base, category: 'watch', fields: { ...common } }).missing).toEqual(['serial_number']);
    const ok = buildCreateItem({ ...base, category: 'watch', fields: { ...common, serial_number: 'AB12' } });
    expect(ok.missing).toEqual([]);
    expect(ok.body).toMatchObject({ category: 'watch', serial_number: 'AB12', declaration_accepted: true, acquisition_price: { amount: 9500, currency: 'EUR' } });
  });

  it('sneakers : modèle, SKU, taille et (commande ou ID certificat)', () => {
    const r = buildCreateItem({ ...base, category: 'sneaker', fields: { ...common } });
    expect(r.missing).toEqual(expect.arrayContaining(['model', 'sku', 'size', 'order_id']));
    const ok = buildCreateItem({ ...base, category: 'sneaker', fields: { ...common, model: 'Dunk', sku: 'DD1391', size: '42', certificate_external_id: 'G1' } });
    expect(ok.missing).toEqual([]);
  });

  it('prix d’acquisition obligatoire et numérique (P15)', () => {
    expect(buildCreateItem({ ...base, category: 'handbag', fields: { ...common, price: '', auth_code: 'X' } }).missing).toContain('price');
    expect(buildCreateItem({ ...base, category: 'handbag', fields: { ...common, price: 'abc', auth_code: 'X' } }).missing).toContain('price');
    expect(buildCreateItem({ ...base, category: 'handbag', fields: { ...common, price: '1200,50', auth_code: 'X' } }).body?.acquisition_price.amount).toBe(1200.5);
  });

  it('date au format AAAA-MM-JJ', () => {
    const r = buildCreateItem({ ...base, category: 'handbag', fields: { ...common, auth_code: 'X', acquisition_date: '01/02/2024' } });
    expect(r.missing).toContain('acquisition_date');
  });

  it('catégorie obligatoire', () => {
    expect(buildCreateItem({ ...base, category: null, fields: { ...common } }).missing).toContain('category');
  });

  it('le QR remplit l’identifiant unique de la catégorie (P7)', () => {
    expect(uniqueIdField('watch')).toBe('serial_number');
    expect(uniqueIdField('handbag')).toBe('auth_code');
    expect(uniqueIdField('certified_other')).toBe('unique_id_value');
  });
});
