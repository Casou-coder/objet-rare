import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authErrorKey } from '@/stores/session';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

/**
 * Exécute une action de connexion : chargement, message d'erreur traduit,
 * puis retour à l'aiguillage (profil ou collection) si la session est ouverte.
 */
export function useAuthAction() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const run = async (name: string, action: () => Promise<boolean | void>) => {
    setBusy(name);
    setError(undefined);
    try {
      const done = await action();
      if (done !== false) router.replace('/');
    } catch (e) {
      setError(t(authErrorKey(e)));
    } finally {
      setBusy(null);
    }
  };

  return { busy, error, setError, run };
}
