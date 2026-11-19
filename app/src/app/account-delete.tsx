import { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDeleteAccount } from '@/api/hooks';
import { Button, Title, useErrorMessage } from '@/components/ui';

/** Suppression du compte : avertissement, confirmation explicite, puis purge et déconnexion (Page mon compte §6). */
export default function AccountDeleteScreen() {
  const { t } = useTranslation();
  const del = useDeleteAccount();
  const errorMessage = useErrorMessage();
  const [error, setError] = useState<string>();

  return (
    <SafeAreaView className="flex-1 bg-bone px-6 dark:bg-ink">
      <View className="flex-1 justify-center">
        <Title>{t('v.account.deleteTitle')}</Title>
        <Text className="mb-8 mt-4 text-base leading-6 text-ink dark:text-bone">{t('v.account.deleteWarning')}</Text>
        {error ? <Text className="mb-4 text-red-500">{error}</Text> : null}
        <Button
          label={t('v.account.deleteConfirm')}
          variant="danger"
          loading={del.isPending}
          onPress={() =>
            del.mutate(undefined, {
              onSuccess: () => router.replace('/(auth)/login'),
              onError: (e) => setError(errorMessage(e)),
            })
          }
        />
        <View className="mt-3">
          <Button label={t('v.common.cancel')} variant="link" onPress={() => router.back()} />
        </View>
      </View>
    </SafeAreaView>
  );
}
