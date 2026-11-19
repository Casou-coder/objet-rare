import fr from '@/locales/v1.fr';
import en from '@/locales/v1.en';
import { formatMoney } from '@/lib/format';

function flatten(o: object, prefix = ''): Record<string, string> {
  return Object.entries(o).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') acc[key] = v;
    else Object.assign(acc, flatten(v as object, key));
    return acc;
  }, {});
}

describe('wording V1', () => {
  const f = flatten(fr);
  const e = flatten(en);

  it('FR et EN ont exactement les mêmes clés', () => {
    expect(Object.keys(e).sort()).toEqual(Object.keys(f).sort());
  });

  it('messages bloquants figés (UX_FLOWS_V1 §3, décision P18)', () => {
    expect(f['v.errors.CERTIFICATE_NOT_READABLE']).toBe('Ce document n’est pas suffisamment lisible.');
    expect(f['v.errors.DUPLICATE_CERTIFICATE']).toBe('Ce certificat est déjà associé à un objet existant.');
    expect(f['v.errors.UNIQUE_ID_CONFLICT']).toBe('Un conflit d’unicité a été détecté.');
    expect(f['v.errors.FREE_LIMIT_REACHED']).toBe('Limite d’objets atteinte. Passez en Premium.');
  });

  it('aucun vocabulaire interdit (README §5 : l’app n’authentifie ni ne certifie)', () => {
    const forbidden = /authentifi|certifié par|validé|expertisé|investiss|trading|partager|télécharger/i;
    const offenders = Object.entries(f).filter(([k, v]) => forbidden.test(v) && !k.endsWith('passport.info') && !k.endsWith('passport.disclaimer'));
    expect(offenders).toEqual([]);
  });

  it('aucune mention « Prototype »', () => {
    expect(Object.values(f).concat(Object.values(e)).some((v) => /prototype/i.test(v))).toBe(false);
  });
});

describe('formatMoney', () => {
  it('formate sans décimales ni notation spéculative', () => {
    expect(formatMoney(9500, 'EUR', 'fr').replace(/\s/g, ' ')).toMatch(/9 500 €|9 500 €/);
    expect(formatMoney(9500, 'USD', 'en')).toBe('US$9,500');
  });
});
