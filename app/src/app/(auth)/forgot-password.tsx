import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { authErrorKey, useSession } from '@/stores/session';
import { EMAIL_RE } from '@/features/auth/useAuthAction';
import { Button, Field, Title } from '@/components/ui';

/** Mot de passe oublié : e-mail de réinitialisation Firebase, réponse neutre. */
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const resetPassword = useSession((s) => s.resetPassword);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!EMAIL_RE.test(email.trim())) return setError(t('v.auth.invalidEmail'));
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(t(authErrorKey(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-bone dark:bg-ink">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
        <Title>{t('v.auth.forgotTitle')}</Title>
        {sent ? (
          <Text className="mt-6 text-ink dark:text-bone">{t('v.auth.resetSent')}</Text>
        ) : (
          <View className="mt-8">
            <Field
              label={t('v.auth.email')}
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(undefined); }}
            />
            {error ? <Text className="mb-3 text-red-500">{error}</Text> : null}
            <Button label={t('v.auth.resetSubmit')} onPress={() => void onSubmit()} loading={loading} />
          </View>
        )}
        <View className="mt-4">
          <Button label={t('v.common.back')} variant="link" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
