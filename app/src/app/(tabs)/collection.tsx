import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useItems } from '@/api/hooks';
import { BannerAd } from '@/components/BannerAd';
import { Chips, EmptyState, ErrorState, ItemImage, Placeholders, Title } from '@/components/ui';
import { useStartAdd } from '@/features/add/useStartAdd';
import { colors } from '@/lib/theme';

/** Ma collection : galerie privée. Image, nom, date d'ajout — rien d'autre (Page ma collection §3). */
export default function CollectionScreen() {
  const { t } = useTranslation();
  const [sort, setSort] = useState<'recent' | 'oldest'>('recent');
  const items = useItems('collection', sort);
  const startAdd = useStartAdd();

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <View className="px-5 pt-4">
        <Title>{t('v.collection.title')}</Title>
        <View className="mt-4">
          <Chips
            value={sort}
            onChange={setSort}
            options={[
              { value: 'recent', label: t('v.collection.sortRecent') },
              { value: 'oldest', label: t('v.collection.sortOldest') },
            ]}
          />
        </View>
      </View>

      {items.isPending ? (
        <View className="px-5"><Placeholders count={6} /></View>
      ) : items.isError ? (
        <ErrorState message={t('v.collection.error')} onRetry={() => items.refetch()} />
      ) : (
        <FlatList
          data={items.data}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 12, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={items.isRefetching} onRefresh={() => items.refetch()} tintColor={colors.gold} />}
          ListEmptyComponent={<EmptyState message={t('v.collection.empty')} cta={t('v.collection.emptyCta')} onPress={startAdd} />}
          ListFooterComponent={items.data.length ? <BannerAd /> : null}
          renderItem={({ item }) => (
            <Pressable className="flex-1 active:opacity-80" onPress={() => router.push(`/item/${item.id}`)} accessibilityRole="button">
              <ItemImage uri={item.primary_image_url} name={item.name} size={170} />
              <Text numberOfLines={2} className="mt-2 text-ink dark:text-bone">{item.name}</Text>
            </Pressable>
          )}
        />
      )}

      <Pressable
        onPress={startAdd}
        accessibilityRole="button"
        accessibilityLabel={t('v.vault.emptyCta')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-gold shadow-lg active:opacity-80"
      >
        <Plus color={colors.ink} size={26} />
      </Pressable>
    </SafeAreaView>
  );
}
