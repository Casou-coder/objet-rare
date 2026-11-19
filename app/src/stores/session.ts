import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { i18n } from '@/lib/i18n';
import { firebaseAuth, firebaseEnabled } from '@/lib/firebase';
import { appleIdToken, googleIdToken, googleSignOut } from '@/features/auth/social';

/**
 * Session utilisateur (décision P9 : Apple + Google + e-mail via Firebase Auth).
 * - « firebase » : jeton d'identité Firebase envoyé à l'API, vérifié côté serveur.
 * - « dev » : session de développement (jeton « dev:<uid>:<email> »), uniquement quand Firebase
 *   n'est pas configuré ET en mode développement ; l'API la refuse hors AUTH_MODE=dev.
 */
export type AuthMode = 'firebase' | 'dev' | 'unconfigured';
export const authMode: AuthMode = firebaseEnabled ? 'firebase' : __DEV__ ? 'dev' : 'unconfigured';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: Status;
  email: string | null;
  uid: string | null;
  getToken: () => Promise<string | null>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Renvoie false si l'utilisateur a annulé. */
  signInGoogle: () => Promise<boolean>;
  signInApple: () => Promise<boolean>;
  signInDev: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  onUnauthorized: () => void;
}

const DEV_KEY = 'vault.dev-session';

export function devUidFromEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 64);
}

const auth = () => {
  const a = firebaseAuth();
  a.languageCode = i18n.language === 'en' ? 'en' : 'fr'; // langue des e-mails Firebase
  return a;
};

export const useSession = create<SessionState>((set, get) => ({
  status: 'loading',
  email: null,
  uid: null,

  getToken: async () => {
    if (authMode === 'firebase') return (await firebaseAuth().currentUser?.getIdToken()) ?? null;
    const { uid, email } = get();
    return uid && email ? `dev:${uid}:${email}` : null;
  },

  signInEmail: async (email, password) => {
    await signInWithEmailAndPassword(auth(), email.trim(), password);
  },

  signUpEmail: async (email, password) => {
    await createUserWithEmailAndPassword(auth(), email.trim(), password);
  },

  resetPassword: async (email) => {
    try {
      await sendPasswordResetEmail(auth(), email.trim());
    } catch (e) {
      // Réponse neutre : ne révèle pas si un compte existe pour cette adresse.
      if ((e as { code?: string }).code !== 'auth/user-not-found') throw e;
    }
  },

  signInGoogle: async () => {
    const idToken = await googleIdToken();
    if (!idToken) return false;
    await signInWithCredential(auth(), GoogleAuthProvider.credential(idToken));
    return true;
  },

  signInApple: async () => {
    const r = await appleIdToken();
    if (!r) return false;
    await signInWithCredential(auth(), new OAuthProvider('apple.com').credential({ idToken: r.idToken, rawNonce: r.rawNonce }));
    return true;
  },

  signInDev: async (email) => {
    if (authMode !== 'dev') throw new Error('dev sign-in disabled');
    const clean = email.trim().toLowerCase();
    const uid = devUidFromEmail(clean);
    await SecureStore.setItemAsync(DEV_KEY, JSON.stringify({ email: clean, uid }));
    set({ status: 'signedIn', email: clean, uid });
  },

  signOut: async () => {
    if (authMode === 'firebase') {
      await googleSignOut();
      await firebaseSignOut(firebaseAuth()).catch(() => undefined);
    } else {
      await SecureStore.deleteItemAsync(DEV_KEY).catch(() => undefined);
    }
    set({ status: 'signedOut', email: null, uid: null });
  },

  onUnauthorized: () => {
    if (get().status === 'signedIn') void get().signOut();
  },
}));

if (authMode === 'firebase') {
  onAuthStateChanged(firebaseAuth(), (user) => {
    useSession.setState(
      user ? { status: 'signedIn', email: user.email, uid: user.uid } : { status: 'signedOut', email: null, uid: null },
    );
  });
} else if (authMode === 'dev') {
  SecureStore.getItemAsync(DEV_KEY)
    .then((raw) => {
      const s = raw ? (JSON.parse(raw) as { email: string; uid: string }) : null;
      useSession.setState(s ? { status: 'signedIn', email: s.email, uid: s.uid } : { status: 'signedOut' });
    })
    .catch(() => useSession.setState({ status: 'signedOut' }));
} else {
  useSession.setState({ status: 'signedOut' });
}

/** Clé de traduction d'une erreur de connexion (aucun détail technique affiché). */
export function authErrorKey(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'v.auth.errors.invalidCredentials';
    case 'auth/invalid-email':
      return 'v.auth.invalidEmail';
    case 'auth/email-already-in-use':
      return 'v.auth.errors.emailInUse';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'v.auth.errors.weakPassword';
    case 'auth/too-many-requests':
      return 'v.auth.errors.tooManyRequests';
    case 'auth/network-request-failed':
      return 'v.common.networkError';
    case 'auth/account-exists-with-different-credential':
      return 'v.auth.errors.otherMethod';
    case 'auth/user-disabled':
      return 'v.auth.errors.disabled';
    default:
      return 'v.auth.errors.generic';
  }
}
