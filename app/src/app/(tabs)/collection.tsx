import { useState, useMemo, useEffect, useRef, memo } from 'react';
import { View, Text, FlatList, Pressable, TextInput, ScrollView, Animated, Modal } from 'react-native';
import { BannerAd } from '@/components/BannerAd';
import { Image } from 'expo-image';
import { useSignedPhotoUrl } from '@/lib/photos';
import { Search, Eye, EyeOff, SlidersHorizontal, Check, AlertTriangle } from 'lucide-react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/features/items/hooks';
import { useExpiringWarranties } from '@/features/documents/hooks';
import { usePreferences, CURRENCY_SYMBOL } from '@/stores/preferences';
import { daysUntil } from '@/lib/notifications';
import { categoryLabel } from '@/lib/labels';
import { CATEGORY_ICON } from '@/lib/categories';
import { formatValue } from '@/lib/format';
import { colors } from '@/lib/theme';
import type { Item, ItemCategory } from '@/types/database';

const CATEGORY_FILTERS: { key: ItemCategory | 'all'; label: string }[] = [
  { key: 'all',      label: 'Tous' },
  { key: 'watch',    label: 'Montres' },
  { key: 'handbag',  label: 'Sacs' },
  { key: 'sneaker',  label: 'Sneakers' },
  { key: 'jewelry',  label: 'Bijoux' },
  { key: 'other',    label: 'Autres' },
];

type SortKey = 'recent' | 'price_desc' | 'price_asc' | 'name' | 'brand';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent',     label: 'Récent en premier' },
  { key: 'price_desc', label: 'Prix décroissant' },
  { key: 'price_asc',  label: 'Prix croissant' },
  { key: 'name',       label: 'Nom A → Z' },
  { key: 'brand',      label: 'Marque A → Z' },
];

function SortModal({
  visible, current, onSelect, onClose,
}: {
  visible: boolean;
  current: SortKey;
  onSelect: (key: SortKey) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="rounded-t-3xl bg-white dark:bg-ink-soft px-6 pb-10 pt-4">
          <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200 dark:bg-ink-mute" />
          <Text className="mb-3 font-serif text-lg text-ink dark:text-bone">Trier par</Text>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => { onSelect(opt.key); onClose(); }}
              className="flex-row items-center justify-between border-b border-gray-100 dark:border-ink-mute py-4 last:border-0 active:opacity-70"
            >
              <Text className={`text-base ${current === opt.key ? 'font-semibold text-gold' : 'text-ink dark:text-bone'}`}>
                {opt.label}
              </Text>
              {current === opt.key && <Check color={colors.gold} size={18} />}
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// ── Patrimony card ────────────────────────────────────────────────────────────


function RedactedBar({ width, height = 32 }: { width: number; height?: number }) {
  return (
    <View
      style={{ width, height, borderRadius: 8 }}
      className="bg-bone-soft dark:bg-ink-mute"
    />
  );
}

function PatrimonyCard({
  count,
  totalValue,
  excludedCount,
  isPrivate,
  onToggle,
  currencySymbol,
  compact,
}: {
  count: number;
  totalValue: number | null;
  excludedCount: number;
  isPrivate: boolean;
  onToggle: () => void;
  currencySymbol: string;
  compact: boolean;
}) {
  return (
    <View className="mx-6 mb-4 rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">

      {/* Ligne haute : count + toggle */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-baseline gap-2">
          {isPrivate
            ? <RedactedBar width={36} height={22} />
            : <Text className="font-serif text-2xl text-ink dark:text-bone">{count}</Text>}
          <Text className="text-xs uppercase tracking-widest text-ink-mute dark:text-bone-soft">
            {count === 1 ? 'objet' : 'objets'}
          </Text>
        </View>
        <Pressable onPress={onToggle} hitSlop={12} className="active:opacity-60">
          {isPrivate
            ? <EyeOff color={colors.gold} size={20} />
            : <Eye color={colors.inkGray} size={20} />}
        </Pressable>
      </View>

      {/* Séparateur */}
      <View className="mb-3 h-px bg-gray-100 dark:bg-ink-mute" />

      {/* Valeur totale pleine largeur */}
      <Text className="mb-1 text-xs uppercase tracking-widest text-ink-mute dark:text-bone-soft">
        Valeur totale
      </Text>
      {isPrivate
        ? <RedactedBar width={140} height={36} />
        : totalValue != null
          ? <Text className="font-serif text-3xl text-gold" adjustsFontSizeToFit numberOfLines={1}>
              {formatValue(totalValue, currencySymbol, compact)}
            </Text>
          : <Text className="font-serif text-3xl text-ink-mute dark:text-bone-soft">—</Text>}

      {!isPrivate && excludedCount > 0 && (
        <Text className="mt-1.5 text-xs text-ink-mute dark:text-bone-soft">
          {excludedCount} objet{excludedCount > 1 ? 's' : ''} en devise différente non inclus
        </Text>
      )}

    </View>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.View style={{ opacity }} className="mb-3 flex-row items-center gap-4 rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4">
      <View className="h-16 w-16 rounded-xl bg-bone-soft dark:bg-ink-mute" />
      <View className="flex-1 gap-2">
        <View className="h-2.5 w-16 rounded bg-bone-soft dark:bg-ink-mute" />
        <View className="h-5 w-36 rounded bg-bone-soft dark:bg-ink-mute" />
        <View className="h-3 w-24 rounded bg-bone-soft dark:bg-ink-mute" />
      </View>
    </Animated.View>
  );
}

// ── Item list ─────────────────────────────────────────────────────────────────

const ItemThumbnail = memo(function ItemThumbnail({ item }: { item: Item }) {
  const signedUrl = useSignedPhotoUrl(item.cover_photo_url);
  if (signedUrl) {
    return (
      <View className="h-16 w-16 overflow-hidden rounded-xl bg-bone-soft dark:bg-ink-soft">
        <Image source={{ uri: signedUrl }} style={{ width: 64, height: 64 }} contentFit="cover" cachePolicy="memory-disk" transition={200} />
      </View>
    );
  }
  const CategoryIcon = CATEGORY_ICON[item.category];
  return (
    <View className="h-16 w-16 items-center justify-center rounded-xl bg-bone-soft dark:bg-ink-soft">
      <CategoryIcon color={colors.gold} size={28} />
    </View>
  );
});

const ItemRow = memo(function ItemRow({ item, hasExpiringWarranty }: { item: Item; hasExpiringWarranty?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      className="mb-3 flex-row items-center gap-4 rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-4 active:opacity-80"
    >
      <ItemThumbnail item={item} />
      <View className="flex-1">
        <Text className="text-xs uppercase tracking-wider text-gold">
          {categoryLabel[item.category] ?? item.category}
        </Text>
        <Text className="mt-0.5 font-serif text-xl text-ink dark:text-bone">{item.name}</Text>
        <Text className="text-ink-mute dark:text-bone-soft">{item.brand}</Text>
      </View>
      {hasExpiringWarranty && (
        <View className="ml-2 h-7 w-7 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle color="#D97706" size={14} />
        </View>
      )}
    </Pressable>
  );
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CollectionScreen() {
  const { data: items, isLoading, error, refetch, isRefetching } = useItems();
  const { data: expiringWarranties } = useExpiringWarranties(60);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ItemCategory | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [sortVisible, setSortVisible] = useState(false);

  const expiringItemIds = useMemo(
    () => new Set((expiringWarranties ?? []).map((w) => w.item_id).filter(Boolean) as string[]),
    [expiringWarranties],
  );
  const { statsPrivate: isPrivate, setStatsPrivate, currency, compactValues } = usePreferences();
  const currencySymbol = CURRENCY_SYMBOL[currency];

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const q = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch = !q
        || item.name.toLowerCase().includes(q)
        || item.brand.toLowerCase().includes(q)
        || (item.model ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price_asc':  return (a.purchase_price ?? Infinity) - (b.purchase_price ?? Infinity);
        case 'price_desc': return (b.purchase_price ?? -Infinity) - (a.purchase_price ?? -Infinity);
        case 'name':       return a.name.localeCompare(b.name, 'fr');
        case 'brand':      return a.brand.localeCompare(b.brand, 'fr');
        default:           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [items, search, activeCategory, sort]);

  const { totalValue, excludedCount } = useMemo(() => {
    if (!items?.length) return { totalValue: null, excludedCount: 0 };
    const priced = items.filter((it) => it.purchase_price != null && it.purchase_price > 0);
    const matching = priced.filter((it) => (it.purchase_currency ?? 'EUR') === currency);
    const sum = matching.reduce((acc, it) => acc + (it.purchase_price ?? 0), 0);
    return {
      totalValue: sum > 0 ? sum : null,
      excludedCount: priced.length - matching.length,
    };
  }, [items, currency]);

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <SortModal
        visible={sortVisible}
        current={sort}
        onSelect={setSort}
        onClose={() => setSortVisible(false)}
      />

      {/* Titre */}
      <View className="px-6 pb-3 pt-2">
        <Text className="font-serif text-3xl text-ink dark:text-bone">Ma collection</Text>
      </View>

      {/* Carte patrimoine */}
      {!isLoading && (
        <PatrimonyCard
          count={items?.length ?? 0}
          totalValue={totalValue}
          excludedCount={excludedCount}
          isPrivate={isPrivate}
          onToggle={() => setStatsPrivate(!isPrivate)}
          currencySymbol={currencySymbol}
          compact={compactValues}
        />
      )}

      {/* Bannière garanties expirantes */}
      {!isLoading && expiringWarranties && expiringWarranties.length > 0 && (
        <Pressable
          onPress={() => router.push('/(tabs)/coffre')}
          className="mx-6 mb-3 flex-row items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 active:opacity-80"
        >
          <AlertTriangle color="#D97706" size={18} />
          <View className="flex-1">
            <Text className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {expiringWarranties.length === 1
                ? '1 garantie expire bientôt'
                : `${expiringWarranties.length} garanties expirent bientôt`}
            </Text>
            <Text className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
              La plus proche : {daysUntil(expiringWarranties[0]?.expires_at ?? '')}j → Voir dans le coffre
            </Text>
          </View>
        </Pressable>
      )}

      {/* Recherche + filtres */}
      <View className="px-6 pb-3">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-3 rounded-xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft px-3 py-2.5">
            <Search color={colors.inkGray} size={16} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher…"
              placeholderTextColor={colors.inkGray}
              className="flex-1 text-sm text-ink dark:text-bone"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          <Pressable
            onPress={() => setSortVisible(true)}
            className={`rounded-xl border p-2.5 active:opacity-70 ${sort !== 'recent' ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft'}`}
          >
            <SlidersHorizontal color={sort !== 'recent' ? colors.gold : colors.inkGray} size={18} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 -mx-6 px-6" contentContainerClassName="gap-2">
          {CATEGORY_FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setActiveCategory(f.key)}
              className={`rounded-full border px-4 py-1.5 ${activeCategory === f.key ? 'border-gold bg-gold/10' : 'border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft'}`}
            >
              <Text className={`text-sm ${activeCategory === f.key ? 'text-gold' : 'text-ink-mute dark:text-bone-soft'}`}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Liste */}
      {isLoading ? (
        <View className="px-6 pt-2">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-ink-mute dark:text-bone-soft">
            Erreur de chargement. Vérifie ta connexion.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => <ItemRow item={item} hasExpiringWarranty={expiringItemIds.has(item.id)} />}
          contentContainerClassName="px-6 pb-24"
          refreshing={isRefetching}
          onRefresh={refetch}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View className="mt-20 items-center">
              <Text className="text-ink-mute dark:text-bone-soft">
                {search || activeCategory !== 'all' ? 'Aucun résultat.' : 'Ta collection est vide.'}
              </Text>
              {!search && activeCategory === 'all' && (
                <Pressable onPress={() => router.push('/(tabs)/ajouter')} className="mt-4 rounded-xl bg-gold px-6 py-3">
                  <Text className="font-semibold text-ink">Ajouter mon premier objet</Text>
                </Pressable>
              )}
            </View>
          }
          ListFooterComponent={<BannerAd />}
        />
      )}
    </SafeAreaView>
  );
}
