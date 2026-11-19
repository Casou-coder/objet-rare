import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Image } from 'expo-image';
import { FileText } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/api/client';
import { useCreateItem } from '@/api/hooks';
import { Button, Card, SectionTitle, Title, useErrorMessage } from '@/components/ui';
import { buildCreateItem, useAddDraft } from '@/features/add/draft';
import { formatMoney } from '@/lib/format';
import { colors } from '@/lib/theme';

/** Écran 4 — Vérification & confirmation consciente. L'objet n'est créé qu'ici. */
export default function AddReviewScreen() {
  const { t, i18n } = useTranslation();
  const d = useAddDraft();
  const create = useCreateItem();
  const errorMessage = useErrorMessage();
  const [error, setError] = useState<{ message: string; support: boolean; premium: boolean } | null>(null);
  const { body } = buildCreateItem(d);

  if (!body || !d.certificate) return <Redirect href="/add/form" />;

  const rows: [string, string | undefined][] = [
    [t('v.add.brand'), body.brand],
    [body.category === 'certified_other' ? t('v.add.designation') : t('v.add.model'), body.model],
    [t('v.add.reference'), body.reference_code],
    [t('v.add.serialNumber'), body.serial_number],
    [t('v.add.authCode'), body.auth_code],
    [t('v.add.sku'), body.sku],
    [t('v.add.size'), body.size],
    [t('v.add.orderId'), body.order_id],
    [t('v.add.uniqueId'), body.unique_id_value],
    [t('v.add.price'), formatMoney(body.acquisition_price.amount, body.acquisition_price.currency, i18n.language)],
    [t('v.add.date'), body.acquisition_date],
    [t('v.add.certificateType'), t(`v.add.certTypes.${body.certificate_type}`)],
    [t('v.add.certificateId'), body.certificate_external_id],
  ];

  const confirm = () => {
    setError(null);
    create.mutate(body, {
      onSuccess: (item) => {
        d.reset();
        router.dismissAll();
        router.push(`/item/${item.id}`);
      },
      onError: (e) =>
        setError({
          message: isApiError(e, 'NETWORK') || isApiError(e, 'INTERNAL') ? t('v.add.networkError') : errorMessage(e),
          support: isApiError(e, 'UNIQUE_ID_CONFLICT') || isApiError(e, 'DUPLICATE_CERTIFICATE'),
          premium: isApiError(e, 'FREE_LIMIT_REACHED'),
        }),
    });
  };

  const isPdf = d.certificate.file.mimeType === 'application/pdf';

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Title>{t('v.add.reviewTitle')}</Title>
      <Text className="mt-1 text-ink-mute dark:text-bone-soft">{t(`v.categories.${body.category}`)}</Text>

      <SectionTitle>{t('v.add.certificate')}</SectionTitle>
      {isPdf ? (
        <Card className="flex-row items-center gap-3"><FileText color={colors.gold} size={22} /><Text className="text-ink dark:text-bone">PDF</Text></Card>
      ) : (
        <Image source={{ uri: d.certificate.file.uri }} style={{ height: 220, borderRadius: 16 }} contentFit="contain" />
      )}

      <SectionTitle>{t('v.add.identity')}</SectionTitle>
      <Card>
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <View key={k} className="flex-row justify-between border-b border-gray-100 py-2 last:border-b-0 dark:border-ink-mute">
            <Text className="text-ink-mute dark:text-bone-soft">{k}</Text>
            <Text className="ml-4 flex-1 text-right text-ink dark:text-bone">{v}</Text>
          </View>
        ))}
      </Card>

      <Text className="mt-6 leading-6 text-ink dark:text-bone">{t('v.add.declaration')}</Text>

      {error ? (
        <View className="mt-4">
          <Text className="text-red-500">{error.message}</Text>
          {error.support ? <Text className="mt-1 text-ink-mute dark:text-bone-soft">{t('v.errors.conflictSupport')}</Text> : null}
          {error.premium ? <View className="mt-3"><Button label={t('v.vault.goPremium')} variant="secondary" onPress={() => router.push('/premium')} /></View> : null}
        </View>
      ) : null}

      <View className="mt-6 gap-3">
        <Button label={t('v.add.confirm')} onPress={confirm} loading={create.isPending} />
        <Button label={t('v.common.back')} variant="link" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
