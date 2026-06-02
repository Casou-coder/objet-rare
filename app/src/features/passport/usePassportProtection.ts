import * as LocalAuthentication from 'expo-local-authentication';
import { useBiometric } from '@/stores/biometric';
import { i18n } from '@/lib/i18n';

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
      promptMessage: i18n.t('lock.promptMessage'),
      fallbackLabel: i18n.t('lock.fallbackLabel'),
      cancelLabel: i18n.t('common.cancel'),
    });

    if (result.success) unlock();
    return result.success;
  };

  return { locked, authenticate };
}
