import '../../global.css';
import '@/lib/i18n';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack, router } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { queryClient } from '@/lib/query-client';
import { useSession } from '@/stores/session';
import { usePreferences } from '@/stores/preferences';
import { useBiometric } from '@/stores/biometric';
import { LockScreen } from '@/components/LockScreen';
import { initPurchases, loginPurchases, logoutPurchases } from '@/features/premium/purchases';

const LOCK_AFTER_MS = 2 * 60 * 1000; // verrou biométrique après 2 minutes en arrière-plan (décision P16)

export default function RootLayout() {
  const status = useSession((s) => s.status);
  const uid = useSession((s) => s.uid);
  const theme = usePreferences((s) => s.theme);
  const language = usePreferences((s) => s.language);
  const hydrated = usePreferences((s) => s.hydrated);
  const { setColorScheme } = useColorScheme();
  const lock = useBiometric((s) => s.lock);
  const locked = useBiometric((s) => s.locked);
  const signedIn = status === 'signedIn';

  useEffect(() => { setColorScheme(theme); }, [theme, setColorScheme]);

  useEffect(() => {
    if (hydrated && !language) router.replace('/language-select');
  }, [hydrated, language]);

  useEffect(() => { initPurchases(); }, []);

  useEffect(() => {
    if (uid) loginPurchases(uid).catch(() => undefined);
    else logoutPurchases().catch(() => undefined);
    if (!uid) queryClient.clear(); // aucune donnée d'un autre compte ne reste en mémoire
  }, [uid]);

  const coldLocked = useRef(false);
  useEffect(() => {
    if (signedIn && !coldLocked.current) {
      coldLocked.current = true;
      lock();
    }
  }, [signedIn, lock]);

  useEffect(() => {
    let backgroundedAt: number | null = null;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') backgroundedAt = Date.now();
      else if (state === 'active' && backgroundedAt !== null) {
        if (Date.now() - backgroundedAt > LOCK_AFTER_MS) lock();
        backgroundedAt = null;
      }
    });
    return () => sub.remove();
  }, [lock]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="add" options={{ presentation: 'card' }} />
          <Stack.Screen name="item/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="item/delete" options={{ presentation: 'modal' }} />
          <Stack.Screen name="viewer" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="account-delete" options={{ presentation: 'modal' }} />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="premium" options={{ presentation: 'modal' }} />
          <Stack.Screen name="tutorial" options={{ presentation: 'modal' }} />
          <Stack.Screen name="privacy-policy" options={{ presentation: 'card' }} />
          <Stack.Screen name="language-select" />
        </Stack>
        {signedIn && locked && <LockScreen />}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
