import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from '@/stores/session';
import { useMe } from '@/api/hooks';
import { ErrorState, useErrorMessage } from '@/components/ui';
import { colors } from '@/lib/theme';

/** Aiguillage : onboarding → connexion → profil obligatoire (US2.3) → coffre. */
export default function Index() {
  const { t } = useTranslation();
  const status = useSession((s) => s.status);
  const me = useMe();
  const errorMessage = useErrorMessage();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@onboarding_done').then((v) => setOnboardingDone(v === '1')).catch(() => setOnboardingDone(true));
  }, []);

  if (onboardingDone === false) return <Redirect href="/onboarding" />;
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;
  if (status === 'signedIn' && me.isError) {
    return (
      <View className="flex-1 justify-center bg-bone dark:bg-ink">
        <ErrorState message={errorMessage(me.error, t('v.common.networkError'))} onRetry={() => me.refetch()} />
      </View>
    );
  }
  if (status === 'signedIn' && me.data) {
    return me.data.profile_complete ? <Redirect href="/(tabs)/collection" /> : <Redirect href="/profile" />;
  }
  return (
    <View className="flex-1 items-center justify-center bg-bone dark:bg-ink">
      <ActivityIndicator color={colors.gold} />
    </View>
  );
}
