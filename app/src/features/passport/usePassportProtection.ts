import * as LocalAuthentication from 'expo-local-authentication';
import { useBiometric } from '@/stores/biometric';

// Cached at module level — hardware capabilities don't change during app session
let capabilityPromise: Promise<[boolean, boolean]> | null = null;
function getCapabilities(): Promise<[boolean, boolean]> {
  if (!capabilityPromise) {
    capabilityPromise = Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
  }
  return capabilityPromise;
}

export function usePassportProtection() {
  const { locked, unlock } = useBiometric();

  const authenticate = async (): Promise<boolean> => {
    // __DEV__ bypass: biometrics unavailable in Expo Go
    if (__DEV__) {
      unlock();
      return true;
    }

    const [hasHardware, isEnrolled] = await getCapabilities();

    if (!hasHardware || !isEnrolled) {
      unlock();
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouillez Objet Rare',
      fallbackLabel: 'Utiliser le code',
      cancelLabel: 'Annuler',
    });

    if (result.success) unlock();
    return result.success;
  };

  return { locked, authenticate };
}
