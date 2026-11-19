import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authMode, useSession } from '@/stores/session';
import { appleAvailable, googleAvailable } from '@/features/auth/social';
import { EMAIL_RE, useAuthAction } from '@/features/auth/useAuthAction';
import { Button, Field, Title } from '@/components/ui';

/** Connexion (décision P9) : Apple, Google, e-mail. */
export default function LoginScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const { signInEmail, signInGoogle, signInApple, signInDev } = useSession();
  const { busy, error, setError, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apple, setApple] = useState(false);

  useEffect(() => {
    void appleAvailable().then(setApple);
  }, []);

  const onEmail = () => {
    if (!EMAIL_RE.test(email.trim())) return setError(t('v.auth.invalidEmail'));
    if (authMode === 'dev') return run('email', () => signInDev(email));
    if (!password) return setError(t('v.auth.errors.passwordRequired'));
    return run('email', () => signInEmail(email, password));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-bone dark:bg-ink">
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-12" keyboardShouldPersistTaps="handled">
        <Title>{t('v.auth.title')}</Title>

        {authMode === 'unconfigured' ? (
          <Text className="mt-4 text-ink-mute dark:text-bone-soft">{t('v.auth.errors.generic')}</Text>
        ) : (
          <>
            {authMode === 'dev' && <Text className="mt-3 text-ink-mute dark:text-bone-soft">{t('v.auth.devNotice')}</Text>}

            {(apple || googleAvailable) && (
              <View className="mt-8 gap-3">
                {apple && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={
                      colorScheme === 'dark'
                        ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                        : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                    }
                    cornerRadius={12}
                    style={{ height: 48 }}
                    onPress={() => void run('apple', signInApple)}
                  />
                )}
                {googleAvailable && (
                  <Button
                    label={t('v.auth.google')}
                    variant="secondary"
                    loading={busy === 'google'}
                    disabled={busy !== null}
                    onPress={() => void run('google', signInGoogle)}
                  />
                )}
                <Text className="my-2 text-center text-ink-mute dark:text-bone-soft">{t('v.auth.or')}</Text>
              </View>
            )}

            <View className={apple || googleAvailable ? '' : 'mt-8'}>
              <Field
                label={t('v.auth.email')}
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                value={email}
                onChangeText={(v) => { setEmail(v); setError(undefined); }}
              />
              {authMode === 'firebase' && (
                <Field
                  label={t('v.auth.password')}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(undefined); }}
                />
              )}
              {error ? <Text className="mb-3 text-red-500">{error}</Text> : null}
              <Button label={t('v.auth.submit')} onPress={onEmail} loading={busy === 'email'} disabled={busy !== null} />
            </View>

            {authMode === 'firebase' && (
              <View className="mt-6 items-center gap-4">
                <Link href="/(auth)/forgot-password" className="text-ink-mute underline dark:text-bone-soft">
                  {t('v.auth.forgot')}
                </Link>
                <Link href="/(auth)/signup" className="font-semibold text-ink dark:text-bone">
                  {t('v.auth.createAccount')}
                </Link>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
