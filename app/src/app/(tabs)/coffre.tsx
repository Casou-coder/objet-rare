import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useItems, useMe } from '@/api/hooks';
import { BannerAd } from '@/components/BannerAd';
import { Button, Card, EmptyState, ErrorState, ItemImage, Placeholders, Title } from '@/components/ui';
import { useStartAdd } from '@/features/add/useStartAdd';
import { formatDate, formatMoney } from '@/lib/format';
import { colors } from '@/lib/theme';

const STALE_DAYS = 30;

/** Mon coffre : lecture factuelle, valeur indicative discrète, indicateur seulement si problème. */
export default function VaultScreen() {
  const { t, i18n } = useTranslation();
  const items = useItems('vault');
  const me = useMe();
  const startAdd = useStartAdd();
  const limitReached = me.data && !me.data.limits.can_add_item;

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <View className="px-5 pb-4 pt-4">
        <Title>{t('v.vault.title')}</Title>
      </View>

      {items.isPending ? (
        <View className="px-5"><Placeholders count={4} height={88} columns={1} /></View>
      ) : items.isError ? (
        <ErrorState message={t('v.vault.error')} onRetry={() => items.refetch()} />
      ) : (
        <FlatList
          data={items.data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 12, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={items.isRefetching} onRefresh={() => items.refetch()} tintColor={colors.gold} />}
          ListHeaderComponent={
            limitReached ? (
              <Card className="mb-2">
                <Text className="mb-3 text-ink dark:text-bone">{t('v.vault.limitReached')}</Text>
                <Button label={t('v.vault.goPremium')} variant="secondary" onPress={() => router.push('/premium')} />
              </Card>
            ) : null
          }
          ListEmptyComponent={<EmptyState message={t('v.vault.empty')} cta={t('v.vault.emptyCta')} onPress={startAdd} />}
          ListFooterComponent={items.data.length ? <BannerAd /> : null}
          renderItem={({ item }) => {
            const value = item.indicative_market_value;
            const stale = item.value_as_of && Date.now() - new Date(item.value_as_of).getTime() > STALE_DAYS * 86_400_000;
            const problem = item.document_status && item.document_status !== 'complete' ? item.document_status : null;
            return (
              <Pressable onPress={() => router.push(`/item/${item.id}`)} className="active:opacity-80" accessibilityRole="button">
                <Card className="flex-row items-center gap-4">
                  <View style={{ width: 64 }}>
                    <ItemImage uri={item.primary_image_url} name={item.name} size={64} />
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={1} className="text-ink dark:text-bone">{item.name}</Text>
                    <Text className="mt-1 text-sm text-ink-mute dark:text-bone-soft">
                      {value === null || value === undefined
                        ? t('v.vault.valueUnavailable')
                        : formatMoney(value, item.currency ?? 'EUR', i18n.language)}
                    </Text>
                    {stale && item.value_as_of ? (
                      <Text className="text-xs text-ink-mute dark:text-bone-soft">
                        {t('v.vault.lastUpdate', { date: formatDate(item.value_as_of, i18n.language) })}
                      </Text>
                    ) : null}
                  </View>
                  {problem ? (
                    <View className="rounded-full border border-gold/40 px-2 py-1">
                      <Text className="text-xs text-gold">{t(`v.vault.status.${problem}`)}</Text>
                    </View>
                  ) : null}
                </Card>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
