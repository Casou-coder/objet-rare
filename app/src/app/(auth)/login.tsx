import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/stores/session';
import { Button, Field, Title } from '@/components/ui';

/**
 * Connexion de développement (étape 3). Remplacée par Firebase Auth (Apple, Google, e-mail) à l'étape 4.
 * L'API refuse ces jetons hors AUTH_MODE=dev, et AUTH_MODE=dev est refusé en production.
 */
export default function LoginScreen() {
  const { t } = useTranslation();
  const signInDev = useSession((s) => s.signInDev);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('v.auth.invalidEmail'));
      return;
    }
    setLoading(true);
    try {
      await signInDev(email);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center bg-bone px-6 dark:bg-ink">
      <Title>{t('v.auth.title')}</Title>
      <Text className="mb-8 mt-3 text-ink-mute dark:text-bone-soft">{t('v.auth.devNotice')}</Text>
      <Field
        label={t('v.auth.email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        value={email}
        onChangeText={(v) => { setEmail(v); setError(undefined); }}
        error={error}
      />
      <View className="mt-2">
        <Button label={t('v.auth.submit')} onPress={onSubmit} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}
