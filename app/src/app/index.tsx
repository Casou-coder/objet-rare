import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/stores/auth';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/lib/theme';

export default function Index() {
  const { session, isLoading } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@onboarding_done').then((val) => {
      setOnboardingDone(val === '1');
      setOnboardingChecked(true);
    });
  }, []);

  if (isLoading || !onboardingChecked) {
    return (
      <View className="flex-1 items-center justify-center bg-ink">
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!onboardingDone) return <Redirect href="/onboarding" />;
  return session ? <Redirect href="/(tabs)/collection" /> : <Redirect href="/(auth)/login" />;
}
