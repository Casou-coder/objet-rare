import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/stores/auth';
import { colors } from '@/lib/theme';

export default function SignupScreen() {
  const { t } = useTranslation();
  const signUp = useAuth((s) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      Alert.alert(t('auth.signup.errorTitle'), error.message);
    } else {
      Alert.alert(t('auth.signup.successTitle'), t('auth.signup.successMsg'));
      router.replace('/(auth)/login');
    }
  };

  return (
    <View className="flex-1 justify-center bg-bone dark:bg-ink px-6">
      <Text className="mb-10 font-serif text-3xl text-ink dark:text-bone">{t('auth.signup.title')}</Text>

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
        {loading ? <ActivityIndicator color={colors.ink} /> : <Text className="font-semibold text-ink">{t('auth.signup.submit')}</Text>}
      </Pressable>

      <View className="mt-6 flex-row justify-center">
        <Text className="text-ink-mute dark:text-bone-soft">{t('auth.signup.hasAccount')}</Text>
        <Link href="/(auth)/login" className="text-gold">
          {t('auth.signup.signIn')}
        </Link>
      </View>
    </View>
  );
}
