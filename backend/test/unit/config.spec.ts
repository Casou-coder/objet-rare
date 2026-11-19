import { loadConfig } from '../../src/config';

describe('configuration de l’authentification', () => {
  it('Firebase est le mode par défaut et exige un projet', () => {
    expect(() => loadConfig({})).toThrow(/FIREBASE_PROJECT_ID/);
    expect(loadConfig({ FIREBASE_PROJECT_ID: 'vault-test' }).authMode).toBe('firebase');
  });

  it('le mode dev est refusé en production', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', AUTH_MODE: 'dev' })).toThrow(/interdit en production/);
  });

  it('un mode inconnu est refusé', () => {
    expect(() => loadConfig({ AUTH_MODE: 'none' })).toThrow(/AUTH_MODE/);
  });

  it('le compte de service base64 fournit le projet', () => {
    const json = JSON.stringify({ project_id: 'vault-prod', client_email: 'x', private_key: 'y' });
    const c = loadConfig({ FIREBASE_SERVICE_ACCOUNT_BASE64: Buffer.from(json).toString('base64') });
    expect(c.firebaseProjectId).toBe('vault-prod');
    expect(c.firebaseServiceAccount).toMatchObject({ project_id: 'vault-prod' });
  });

  it('un compte de service illisible est refusé sans afficher son contenu', () => {
    let message = '';
    try {
      loadConfig({ FIREBASE_SERVICE_ACCOUNT_BASE64: 'c2VjcmV0LW5vbi1qc29u' });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/illisible/);
    expect(message).not.toMatch(/secret/);
  });
});
