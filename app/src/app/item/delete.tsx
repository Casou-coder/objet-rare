import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useDeleteItem } from '@/api/hooks';
import { Button, Chips, Field, Title, useErrorMessage } from '@/components/ui';

const REASONS = ['lost', 'stolen', 'sold', 'given', 'destroyed', 'other'] as const;
type Reason = (typeof REASONS)[number];

/** Suppression d'objet : motif obligatoire, purge immédiate et totale (CONTRAT §10.1). */
export default function DeleteItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const del = useDeleteItem();
  const errorMessage = useErrorMessage();
  const [reason, setReason] = useState<Reason | null>(null);
  const [freeText, setFreeText] = useState('');
  const [error, setError] = useState<string>();
  const valid = reason !== null && (reason !== 'other' || freeText.trim().length > 0);

  const submit = () => {
    if (!reason || !valid) return;
    del.mutate(
      { id, reason, free_text: reason === 'other' ? freeText.trim() : undefined },
      {
        onSuccess: () => { router.dismissAll(); router.replace('/(tabs)/collection'); },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-bone dark:bg-ink">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <Title>{t('v.deleteItem.title')}</Title>
        <Text className="mb-6 mt-3 leading-6 text-ink dark:text-bone">{t('v.deleteItem.body')}</Text>
        <Text className="mb-2 text-ink-mute dark:text-bone-soft">{t('v.deleteItem.reason')}</Text>
        <Chips value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: t(`v.deleteItem.reasons.${r}`) }))} />
        {reason === 'other' ? (
          <Field label={t('v.deleteItem.reasons.other')} placeholder={t('v.deleteItem.otherPlaceholder')} value={freeText} onChangeText={setFreeText} maxLength={500} />
        ) : null}
        {error ? <Text className="mb-4 text-red-500">{error}</Text> : null}
        <View className="mt-4 gap-3">
          <Button label={t('v.deleteItem.submit')} variant="danger" disabled={!valid} loading={del.isPending} onPress={submit} />
          <Button label={t('v.common.cancel')} variant="link" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
