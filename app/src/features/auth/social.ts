import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

/**
 * Connexions Apple et Google (décision P9). Elles reposent sur des modules natifs liés à
 * l'identifiant de l'app : indisponibles dans Expo Go, actives dans les builds EAS.
 */
export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

export const googleAvailable =
  !isExpoGo && Boolean(googleWebClientId) && (Platform.OS !== 'ios' || Boolean(googleIosClientId));

export async function appleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios' || isExpoGo) return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

/** Jeton d'identité Google, ou null si l'utilisateur annule. */
export async function googleIdToken(): Promise<string | null> {
  // Chargé à la demande : le module natif n'existe pas dans Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const g = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  g.GoogleSignin.configure({ webClientId: googleWebClientId, iosClientId: googleIosClientId });
  await g.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await g.GoogleSignin.signIn();
  if (!g.isSuccessResponse(res)) return null;
  return res.data.idToken;
}

export async function googleSignOut(): Promise<void> {
  if (!googleAvailable) return;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const g = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  await g.GoogleSignin.signOut().catch(() => undefined);
}

/** Jeton d'identité Apple et nonce brut (anti-rejeu exigé par Firebase), ou null si annulé. */
export async function appleIdToken(): Promise<{ idToken: string; rawNonce: string } | null> {
  const rawNonce = `${Crypto.randomUUID()}${Crypto.randomUUID()}`;
  const nonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  try {
    const r = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce,
    });
    if (!r.identityToken) throw new Error('apple/no-identity-token');
    return { idToken: r.identityToken, rawNonce };
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}
