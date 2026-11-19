import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

/**
 * Session utilisateur. Le fournisseur d'identité est abstrait :
 * - étape 3 : session de développement (jeton « dev:<uid>:<email> », accepté seulement par une API en AUTH_MODE=dev) ;
 * - étape 4 : Firebase Auth (Apple, Google, e-mail — décision P9).
 */
type Status = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: Status;
  email: string | null;
  uid: string | null;
  getToken: () => Promise<string | null>;
  signInDev: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  onUnauthorized: () => void;
}

const KEY = 'vault.dev-session';

export function devUidFromEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 64);
}

export const useSession = create<SessionState>((set, get) => ({
  status: 'loading',
  email: null,
  uid: null,

  getToken: async () => {
    const { uid, email } = get();
    if (!uid || !email) return null;
    return `dev:${uid}:${email}`;
  },

  signInDev: async (email) => {
    const clean = email.trim().toLowerCase();
    const uid = devUidFromEmail(clean);
    await SecureStore.setItemAsync(KEY, JSON.stringify({ email: clean, uid }));
    set({ status: 'signedIn', email: clean, uid });
  },

  signOut: async () => {
    await SecureStore.deleteItemAsync(KEY).catch(() => undefined);
    set({ status: 'signedOut', email: null, uid: null });
  },

  onUnauthorized: () => {
    if (get().status === 'signedIn') void get().signOut();
  },
}));

SecureStore.getItemAsync(KEY)
  .then((raw) => {
    const s = raw ? (JSON.parse(raw) as { email: string; uid: string }) : null;
    useSession.setState(s ? { status: 'signedIn', email: s.email, uid: s.uid } : { status: 'signedOut' });
  })
  .catch(() => useSession.setState({ status: 'signedOut' }));
