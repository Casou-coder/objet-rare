import { getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';

/**
 * Firebase Auth (décision P9) avec le SDK JavaScript : fonctionne dans Expo Go (e-mail)
 * comme dans les builds EAS (e-mail, Google, Apple).
 * Les valeurs EXPO_PUBLIC_FIREBASE_* identifient le projet ; ce ne sont pas des secrets,
 * mais elles restent dans app/.env (hors git) et dans les variables EAS.
 */
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

/**
 * La session Firebase (jeton de rafraîchissement) est gardée dans le trousseau / Keystore
 * via SecureStore, jamais en clair. SecureStore limite la taille d'une valeur : on découpe.
 */
const CHUNK = 1800;
const keyOf = (k: string) => `fb.${k.replace(/[^A-Za-z0-9._-]/g, '_')}`;

export const secureAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const k = keyOf(key);
    const count = Number(await SecureStore.getItemAsync(`${k}.n`));
    if (!count) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${k}.${i}`)));
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const k = keyOf(key);
    const previous = Number(await SecureStore.getItemAsync(`${k}.n`)) || 0;
    const count = Math.max(1, Math.ceil(value.length / CHUNK));
    for (let i = 0; i < count; i++) await SecureStore.setItemAsync(`${k}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    await SecureStore.setItemAsync(`${k}.n`, String(count));
    for (let i = count; i < previous; i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
  },
  async removeItem(key: string): Promise<void> {
    const k = keyOf(key);
    const count = Number(await SecureStore.getItemAsync(`${k}.n`)) || 0;
    await SecureStore.deleteItemAsync(`${k}.n`);
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${k}.${i}`);
  },
};

// getReactNativePersistence n'existe que dans la build « react-native » de firebase/auth
// (résolue par Metro), absente des types publics.
const { getReactNativePersistence } = FirebaseAuth as unknown as {
  getReactNativePersistence: (storage: typeof secureAuthStorage) => FirebaseAuth.Persistence;
};

let auth: FirebaseAuth.Auth | null = null;

export function firebaseAuth(): FirebaseAuth.Auth {
  if (!firebaseEnabled) throw new Error('Firebase non configuré');
  if (auth) return auth;
  const app = getApps()[0] ?? initializeApp(config);
  try {
    auth = FirebaseAuth.initializeAuth(app, { persistence: getReactNativePersistence(secureAuthStorage) });
  } catch {
    auth = FirebaseAuth.getAuth(app); // rechargement à chaud : déjà initialisé
  }
  return auth;
}
