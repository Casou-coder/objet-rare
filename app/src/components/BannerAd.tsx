import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Crown } from 'lucide-react-native';
import { usePlan } from '@/features/premium/usePlan';
import { colors } from '@/lib/theme';

export function BannerAd() {
  const { isPremium } = usePlan();

  if (isPremium) return null;

  return (
    <Pressable
      onPress={() => router.push('/premium')}
      className="mx-4 mb-3 overflow-hidden rounded-2xl border border-gold/30 bg-ink dark:bg-ink active:opacity-80"
    >
      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-gold/10">
          <Crown color={colors.gold} size={16} />
        </View>
        <View className="flex-1">
          <Text className="text-xs font-semibold text-gold">Objet Rare Premium</Text>
          <Text className="text-xs text-bone-soft mt-0.5">
            Supprimez les pubs · Collection illimitée · OCR avancé
          </Text>
        </View>
        <View className="rounded-lg bg-gold px-3 py-1.5">
          <Text className="text-[11px] font-bold text-ink">Voir</Text>
        </View>
      </View>
    </Pressable>
  );
}
