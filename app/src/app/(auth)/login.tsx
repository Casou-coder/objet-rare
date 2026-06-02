import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/stores/auth';
import { colors } from '@/lib/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        Alert.alert(t('auth.login.errorTitle'), error.message);
      } else {
        router.replace('/(tabs)/collection');
      }
    } catch (e: any) {
      Alert.alert(t('auth.login.networkError'), e.message ?? t('auth.login.networkErrorMsg'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-bone dark:bg-ink px-6">
      <Text className="mb-2 font-serif text-4xl text-ink dark:text-bone">Objet Rare</Text>
      <Text className="mb-10 text-ink-mute dark:text-bone-soft">{t('auth.tagline')}</Text>

      <View className="mb-4">
        <Text className="mb-2 text-ink-mute dark:text-bone-soft">{t('auth.email')}</Text>
        <TextInput
          className="rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 text-ink dark:text-bone"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder={t('auth.emailPlaceholder')}
          placeholderTextColor={colors.inkGray}
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View className="mb-6">
        <Text className="mb-2 text-ink-mute dark:text-bone-soft">{t('auth.password')}</Text>
        <TextInput
          className="rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-4 py-3 text-ink dark:text-bone"
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.inkGray}
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable
        onPress={onSubmit}
        disabled={loading}
        className="items-center rounded-xl bg-gold py-4 active:opacity-80"
      >
        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <Text className="font-semibold text-ink">{t('auth.login.submit')}</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/(auth)/forgot-password')} className="mt-4 items-center">
        <Text className="text-ink-mute dark:text-bone-soft">{t('auth.login.forgotPassword')}</Text>
      </Pressable>

      <View className="mt-4 flex-row justify-center">
        <Text className="text-ink-mute dark:text-bone-soft">{t('auth.login.noAccount')}</Text>
        <Link href="/(auth)/signup" className="text-gold">
          {t('auth.login.createAccount')}
        </Link>
      </View>
    </View>
  );
}
