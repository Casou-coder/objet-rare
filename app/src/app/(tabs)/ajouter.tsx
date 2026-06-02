import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@/lib/theme';
import { usePlan, FREE_LIMITS } from '@/features/premium/usePlan';
import type { ItemCategory } from '@/types/database';

const CATEGORIES: { value: ItemCategory; emoji: string }[] = [
  { value: 'handbag',  emoji: '👜' },
  { value: 'sneaker',  emoji: '👟' },
  { value: 'watch',    emoji: '⌚' },
  { value: 'jewelry',  emoji: '💎' },
  { value: 'other',    emoji: '✨' },
];

export default function AjouterScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ItemCategory | null>(null);
  const { canAddItem, itemCount, isPremium } = usePlan();

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top']}>
      <ScrollView contentContainerClassName="px-6 pb-24 pt-2">
        <Text className="font-serif text-3xl text-ink dark:text-bone">{t('add.title')}</Text>
        <Text className="mt-1 text-ink-mute dark:text-bone-soft">{t('add.subtitle')}</Text>

        {!isPremium && (
          <Pressable
            onPress={() => router.push('/premium')}
            className="mt-4 flex-row items-center justify-between rounded-xl border border-gold/30 bg-gold/10 px-4 py-2"
          >
            <View className="flex-row items-center gap-2">
              <Lock color={colors.gold} size={14} />
              <Text className="text-xs text-gold">
                {itemCount}/{FREE_LIMITS.items} objets — {t('add.freePlan')}
              </Text>
            </View>
            <Text className="text-xs font-semibold text-gold">{t('add.premiumCta')}</Text>
          </Pressable>
        )}

        {canAddItem ? (
          <>
            <View className="mt-6 flex-row flex-wrap justify-between">
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => setSelected(c.value)}
                  className={`mb-3 w-[48%] items-center rounded-2xl border p-6 ${
                    selected === c.value
                      ? 'border-gold bg-white dark:bg-ink-soft'
                      : 'border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft'
                  }`}
                >
                  <Text className="text-4xl">{c.emoji}</Text>
                  <Text className="mt-2 text-ink dark:text-bone">{t(`item.categories.${c.value}`)}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              disabled={!selected}
              onPress={() => router.push({ pathname: '/item/new', params: { category: selected! } })}
              className={`mt-6 items-center rounded-xl py-4 ${selected ? 'bg-gold' : 'bg-gray-200 dark:bg-ink-mute'}`}
            >
              <Text className={`font-semibold ${selected ? 'text-ink' : 'text-ink-mute dark:text-bone-soft'}`}>
                {t('common.continue')}
              </Text>
            </Pressable>
          </>
        ) : (
          <View className="mt-10 items-center px-4">
            <Text className="mb-2 font-serif text-xl text-ink dark:text-bone">{t('add.limitTitle')}</Text>
            <Text className="mb-8 text-center text-ink-mute dark:text-bone-soft">
              {t('add.limitMsg', { count: FREE_LIMITS.items })}{'\n'}
              {t('add.limitPremiumMsg')}
            </Text>
            <Pressable
              onPress={() => router.push('/premium')}
              className="w-full items-center rounded-xl bg-gold py-4"
            >
              <Text className="font-semibold text-ink">{t('add.discoverPremium')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
