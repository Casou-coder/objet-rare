import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FileText, Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAllDocuments } from '@/api/hooks';
import { Card, EmptyState, ErrorState, Placeholders, SectionTitle, Title } from '@/components/ui';
import { useStartAdd } from '@/features/add/useStartAdd';
import { formatDate } from '@/lib/format';
import { colors } from '@/lib/theme';

function Row({ title, subtitle, flag, locked, onPress }: { title: string; subtitle: string; flag?: string; locked?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mb-3 active:opacity-80" accessibilityRole="button">
      <Card className="flex-row items-center gap-3">
        {locked ? <Lock color={colors.inkGray} size={20} /> : <FileText color={colors.gold} size={20} />}
        <View className="flex-1">
          <Text numberOfLines={1} className="text-ink dark:text-bone">{title}</Text>
          <Text className="text-xs text-ink-mute dark:text-bone-soft">{subtitle}</Text>
        </View>
        {flag ? <Text className="text-xs text-gold">{flag}</Text> : null}
      </Card>
    </Pressable>
  );
}

/** Documents : coffre documentaire, lecture seule. Certificats puis assurances (ordre fixe). */
export default function DocumentsScreen() {
  const { t, i18n } = useTranslation();
  const docs = useAllDocuments();
  const startAdd = useStartAdd();

  const body = () => {
    if (docs.isPending) return <Placeholders count={4} height={64} columns={1} />;
    if (docs.isError) return <ErrorState message={t('v.documents.error')} onRetry={() => docs.refetch()} />;
    const { certificates, insurances } = docs.data;
    if (!certificates.length && !insurances.length) {
      return <EmptyState message={t('v.documents.empty')} cta={t('v.documents.emptyCta')} onPress={startAdd} />;
    }
    return (
      <>
        <SectionTitle>{t('v.documents.certificates')}</SectionTitle>
        {certificates.map((c) => (
          <Row
            key={`c-${c.related_object_id}`}
            title={c.related_object_name ?? ''}
            subtitle={`${t('v.documents.certificate')} · ${c.uploaded_at ? formatDate(c.uploaded_at, i18n.language) : ''}`}
            flag={c.document_status === 'action_required' ? t('v.documents.actionRequired') : undefined}
            onPress={() =>
              c.document_status === 'action_required'
                ? router.push(`/item/${c.related_object_id}`)
                : router.push({ pathname: '/viewer', params: { itemId: c.related_object_id!, docId: 'certificate' } })
            }
          />
        ))}
        {insurances.length ? <SectionTitle>{t('v.documents.insurances')}</SectionTitle> : null}
        {insurances.map((d) => (
          <Row
            key={d.id}
            title={d.related_object_name}
            subtitle={`${t('v.documents.insurance')} · ${formatDate(d.uploaded_at, i18n.language)}`}
            locked={d.locked}
            flag={d.locked ? t('v.documents.locked') : undefined}
            onPress={() =>
              d.locked ? router.push('/premium') : router.push({ pathname: '/viewer', params: { itemId: d.related_object_id, docId: d.id } })
            }
          />
        ))}
      </>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={docs.isRefetching} onRefresh={() => docs.refetch()} tintColor={colors.gold} />}
      >
        <Title>{t('v.documents.title')}</Title>
        <View className="mt-2">{body()}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
