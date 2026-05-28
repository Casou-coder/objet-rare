import '../../global.css';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/stores/auth';
import { usePreferences } from '@/stores/preferences';
import { useBiometric } from '@/stores/biometric';
import { LockScreen } from '@/components/LockScreen';
import { initPurchases, loginPurchases, logoutPurchases } from '@/features/premium/purchases';
import { fetchItems } from '@/features/items/api';
import { itemKeys } from '@/features/items/hooks';

const LOCK_AFTER_MS = 2 * 60 * 1000; // 2 minutes en arrière-plan

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1_000,
});

export default function RootLayout() {
  const user    = useAuth((s) => s.user);
  const session = useAuth((s) => s.session);
  const theme   = usePreferences((s) => s.theme);
  const { setColorScheme } = useColorScheme();
  const lock    = useBiometric((s) => s.lock);
  const locked  = useBiometric((s) => s.locked);

  // Keep nativewind in sync with the preferences store
  useEffect(() => { setColorScheme(theme); }, [theme, setColorScheme]);

  useEffect(() => { initPurchases(); }, []);

  // Prefetch items as soon as we have a session (covers both cold start and login)
  useEffect(() => {
    if (session) {
      queryClient.prefetchQuery({ queryKey: itemKeys.list(), queryFn: fetchItems });
    }
  }, [session]);

  useEffect(() => {
    if (user?.id) loginPurchases(user.id).catch(() => {});
    else          logoutPurchases().catch(() => {});
  }, [user?.id]);

  // Lock on cold start when a session already exists (returning user)
  const coldLocked = useRef(false);
  useEffect(() => {
    if (session && !coldLocked.current) {
      coldLocked.current = true;
      lock();
    }
  }, [session, lock]);

  // Re-lock after LOCK_AFTER_MS in background
  useEffect(() => {
    let backgroundedAt: number | null = null;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        backgroundedAt = Date.now();
      } else if (state === 'active' && backgroundedAt !== null) {
        if (Date.now() - backgroundedAt > LOCK_AFTER_MS) lock();
        backgroundedAt = null;
      }
    });
    return () => sub.remove();
  }, [lock]);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="item/[id]"      options={{ presentation: 'card' }} />
          <Stack.Screen name="item/new"        options={{ presentation: 'card' }} />
          <Stack.Screen name="item/[id]/edit"  options={{ presentation: 'card' }} />
          <Stack.Screen name="onboarding"      options={{ headerShown: false }} />
          <Stack.Screen name="premium"         options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="tutorial"        options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="privacy-policy" options={{ presentation: 'card', headerShown: false }} />
        </Stack>
        {session && locked && <LockScreen />}
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
