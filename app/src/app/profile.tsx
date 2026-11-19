import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePutMe } from '@/api/hooks';
import { Button, Field, Title, useErrorMessage } from '@/components/ui';

/** Complétion du profil : nom complet obligatoire (UX_FLOWS §1, décision P8). */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const putMe = usePutMe();
  const errorMessage = useErrorMessage();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const onSubmit = () => {
    if (name.trim().length < 2) {
      setError(t('v.profile.tooShort'));
      return;
    }
    putMe.mutate(name.trim(), {
      onSuccess: () => router.replace('/(tabs)/collection'),
      onError: (e) => setError(errorMessage(e)),
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-center bg-bone px-6 dark:bg-ink">
      <Title>{t('v.profile.title')}</Title>
      <Text className="mb-8 mt-3 text-ink-mute dark:text-bone-soft">{t('v.profile.body')}</Text>
      <Field
        label={t('v.profile.label')}
        autoComplete="name"
        textContentType="name"
        value={name}
        onChangeText={(v) => { setName(v); setError(undefined); }}
        error={error}
      />
      <View className="mt-2">
        <Button label={t('v.profile.submit')} onPress={onSubmit} loading={putMe.isPending} />
      </View>
    </KeyboardAvoidingView>
  );
}
