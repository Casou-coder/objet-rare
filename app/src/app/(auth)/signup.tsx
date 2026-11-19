import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSession } from '@/stores/session';
import { EMAIL_RE, PASSWORD_MIN, useAuthAction } from '@/features/auth/useAuthAction';
import { Button, Field, Title } from '@/components/ui';

/** Création de compte par e-mail (décision P9). */
export default function SignupScreen() {
  const { t } = useTranslation();
  const signUpEmail = useSession((s) => s.signUpEmail);
  const { busy, error, setError, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    if (!EMAIL_RE.test(email.trim())) return setError(t('v.auth.invalidEmail'));
    if (password.length < PASSWORD_MIN) return setError(t('v.auth.errors.weakPassword'));
    return run('signup', () => signUpEmail(email, password));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-bone dark:bg-ink">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
        <Title>{t('v.auth.signupTitle')}</Title>
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
          <Field
            label={t('v.auth.password')}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={(v) => { setPassword(v); setError(undefined); }}
          />
          <Text className="-mt-2 mb-4 text-xs text-ink-mute dark:text-bone-soft">{t('v.auth.passwordHint')}</Text>
          {error ? <Text className="mb-3 text-red-500">{error}</Text> : null}
          <Button label={t('v.auth.signupSubmit')} onPress={onSubmit} loading={busy === 'signup'} />
          <View className="mt-4">
            <Button label={t('v.common.back')} variant="link" onPress={() => router.back()} />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
