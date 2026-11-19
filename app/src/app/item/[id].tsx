import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { ChevronLeft, FileText, Lock, MoreHorizontal } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { useAddDocument, useItem, useItemDocuments, useMe, useTimeseries } from '@/api/hooks';
import { fileSize, normalizeMime } from '@/api/upload';
import { Button, Card, ErrorState, ItemImage, Placeholders, SectionTitle, useErrorMessage } from '@/components/ui';
import { useScreenProtection } from '@/features/passport/useScreenProtection';
import { formatDate, formatMoney } from '@/lib/format';
import { colors } from '@/lib/theme';

function Line({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-ink-mute dark:text-bone-soft">{label}</Text>
      <Text className="ml-4 flex-1 text-right text-ink dark:text-bone">{value}</Text>
    </View>
  );
}

/** Passeport produit : dossier numérique personnel. Section Preuve & documents toujours en premier. */
export default function PassportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { colorScheme } = useColorScheme();
  const item = useItem(id);
  const docs = useItemDocuments(id);
  const series = useTimeseries(id);
  const me = useMe();
  const addDoc = useAddDocument(id);
  const errorMessage = useErrorMessage();
  const [docError, setDocError] = useState<string>();
  useScreenProtection();

  const header = (
    <View className="flex-row items-center justify-between px-4 py-2">
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('v.common.back')}>
        <ChevronLeft color={colorScheme === 'dark' ? colors.bone : colors.ink} size={26} />
      </Pressable>
      {item.data ? (
        <Pressable
          hitSlop={10}
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(item.data.name, undefined, [
              { text: t('v.passport.deleteItem'), style: 'destructive', onPress: () => router.push({ pathname: '/item/delete', params: { id } }) },
              { text: t('v.common.cancel'), style: 'cancel' },
            ])
          }
        >
          <MoreHorizontal color={colors.inkGray} size={22} />
        </Pressable>
      ) : null}
    </View>
  );

  if (item.isPending) {
    return <SafeAreaView className="flex-1 bg-bone dark:bg-ink">{header}<View className="p-5"><Placeholders count={3} height={120} columns={1} /></View></SafeAreaView>;
  }
  if (item.isError) {
    return <SafeAreaView className="flex-1 bg-bone dark:bg-ink">{header}<ErrorState message={t('v.passport.error')} onRetry={() => item.refetch()} /></SafeAreaView>;
  }

  const it = item.data;
  const premium = me.data?.plan === 'premium';
  const unreadable = it.certificate?.readability_status === 'unreadable';
  const holder = it.proof_status.includes('holder_confirmed')
    ? t('v.passport.holderConfirmed')
    : it.proof_status.includes('holder_detected')
      ? t('v.passport.holderDetected')
      : t('v.passport.holderNotDetected');
  const insuranceCount = (docs.data ?? []).filter((d) => d.type === 'insurance').length;
  const canAddInsurance = premium || insuranceCount < (me.data?.limits.free_insurance_per_item ?? 1);

  const pickDocument = async (type: 'insurance' | 'other') => {
    setDocError(undefined);
    const r = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    addDoc.mutate(
      { type, file: { uri: a.uri, mimeType: normalizeMime(a.mimeType, a.name), size: await fileSize(a.uri, a.size) } },
      { onError: (e) => setDocError(errorMessage(e)) },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      {header}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={item.isRefetching} onRefresh={() => { item.refetch(); docs.refetch(); }} tintColor={colors.gold} />}
      >
        {/* 1. En-tête objet : aucun badge, aucun statut */}
        <ItemImage uri={it.primary_image_url} name={it.name} size={240} />
        <Text className="mt-4 font-serif text-3xl text-ink dark:text-bone">{it.name}</Text>
        <Text className="mt-1 text-ink-mute dark:text-bone-soft">{t(`v.categories.${it.category}`)}</Text>

        {/* 2. Preuve & documents (prioritaire) */}
        <SectionTitle>{t('v.passport.proofTitle')}</SectionTitle>
        <Card className={unreadable ? 'border-gold' : ''}>
          {it.certificate ? <Text className="py-1 text-ink dark:text-bone">{t('v.passport.certificateProvided')}</Text> : null}
          <Text className="py-1 text-ink dark:text-bone">{t('v.passport.idRegistered')}</Text>
          {unreadable ? (
            <View className="py-1">
              <Text className="text-gold">{t('v.passport.unreadable')}</Text>
            </View>
          ) : (
            <Text className="py-1 text-ink dark:text-bone">{t('v.passport.readable')}</Text>
          )}
          <Text className="py-1 text-ink-mute dark:text-bone-soft">{holder}</Text>
          <View className="mt-2 border-t border-gray-100 pt-2 dark:border-ink-mute">
            <Line label={t('v.passport.identifier')} value={it.unique_id.value} />
            <Line label={t('v.passport.reference')} value={it.reference_code} />
            <Line label={t('v.passport.acquisitionDate')} value={it.acquisition_date ? formatDate(it.acquisition_date, i18n.language) : null} />
          </View>
          <Text className="mt-3 text-xs leading-5 text-ink-mute dark:text-bone-soft">{t('v.passport.info')}</Text>
        </Card>

        {/* 3. Valeur : secondaire, jamais agrégée */}
        <SectionTitle>{t('v.passport.valueTitle')}</SectionTitle>
        <Card>
          <Line label={t('v.passport.acquisitionPrice')} value={formatMoney(it.acquisition_price.amount, it.acquisition_price.currency, i18n.language)} />
          <Line
            label={t('v.passport.marketValue')}
            value={
              it.value.status === 'updating'
                ? t('v.passport.updating')
                : it.value.indicative_market_value === null
                  ? t('v.vault.valueUnavailable')
                  : formatMoney(it.value.indicative_market_value, it.value.currency ?? 'EUR', i18n.language)
            }
          />
          <Line label={t('v.passport.lastUpdate')} value={it.value.as_of ? formatDate(it.value.as_of, i18n.language) : null} />
          {series.data?.points.length ? (
            <View className="mt-2">
              <Text className="mb-1 text-ink-mute dark:text-bone-soft">{t('v.passport.history')}</Text>
              {series.data.points.map((p) => (
                <Line key={p.as_of_date} label={formatDate(p.as_of_date, i18n.language)} value={formatMoney(p.value_amount, p.currency, i18n.language)} />
              ))}
              {series.data.limited ? <Text className="mt-1 text-xs text-gold">{t('v.passport.historyLimited')}</Text> : null}
            </View>
          ) : null}
          <Text className="mt-3 text-xs leading-5 text-ink-mute dark:text-bone-soft">{t('v.passport.disclaimer')}</Text>
        </Card>

        {/* 4. Documents : ouverture dans le viewer sécurisé, aucun téléchargement */}
        <SectionTitle>{t('v.passport.documentsTitle')}</SectionTitle>
        <Pressable
          className="mb-3 active:opacity-80"
          onPress={() => router.push({ pathname: '/viewer', params: { itemId: id, docId: 'certificate' } })}
        >
          <Card className="flex-row items-center gap-3">
            <FileText color={colors.gold} size={20} />
            <Text className="flex-1 text-ink dark:text-bone">{t('v.documents.certificate')}</Text>
          </Card>
        </Pressable>
        {docs.isPending ? <ActivityIndicator color={colors.gold} /> : null}
        {(docs.data ?? []).map((doc) => (
          <Pressable
            key={doc.id}
            className="mb-3 active:opacity-80"
            onPress={() => (doc.locked ? router.push('/premium') : router.push({ pathname: '/viewer', params: { itemId: id, docId: doc.id } }))}
          >
            <Card className="flex-row items-center gap-3">
              {doc.locked ? <Lock color={colors.inkGray} size={20} /> : <FileText color={colors.gold} size={20} />}
              <Text className="flex-1 text-ink dark:text-bone">{t(`v.documents.${doc.type}`)}</Text>
              <Text className="text-xs text-ink-mute dark:text-bone-soft">
                {doc.locked ? t('v.documents.locked') : formatDate(doc.uploaded_at, i18n.language)}
              </Text>
            </Card>
          </Pressable>
        ))}
        {docError ? <Text className="mb-3 text-red-500">{docError}</Text> : null}
        <View className="gap-2">
          {canAddInsurance ? (
            <Button label={t('v.documents.addInsurance')} variant="secondary" loading={addDoc.isPending} onPress={() => void pickDocument('insurance')} />
          ) : null}
          {premium ? <Button label={t('v.documents.addOther')} variant="link" onPress={() => void pickDocument('other')} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
