import { scoreReadability } from '../../src/readability/readability';
import { readableCertificate, unreadableCertificate } from '../helpers';

describe('score de lisibilité (seuil 65)', () => {
  it('un certificat net et contrasté passe le seuil', async () => {
    const { score } = await scoreReadability(await readableCertificate(), 'image/png');
    expect(score).toBeGreaterThanOrEqual(65);
  });

  it('une image floue et basse résolution est bloquée', async () => {
    const { score } = await scoreReadability(await unreadableCertificate(), 'image/png');
    expect(score).toBeLessThan(65);
  });

  it('un fichier corrompu vaut 0', async () => {
    const { score } = await scoreReadability(Buffer.from('not an image'), 'image/jpeg');
    expect(score).toBe(0);
  });

  it('un PDF sans texte exploitable est bloqué', async () => {
    const { score } = await scoreReadability(Buffer.from('%PDF-1.4\n%%EOF'), 'application/pdf');
    expect(score).toBeLessThan(65);
  });
});
