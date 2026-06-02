import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Check, Crown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { usePurchases } from '@/features/premium/usePurchases';
import type { RCOffering, RCPackage } from '@/features/premium/purchases';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

type PlanId = 'monthly' | 'annual' | 'lifetime';

const PLAN_META: Record<PlanId, { fallbackPrice: string }> = {
  monthly:  { fallbackPrice: '1,99 €'   },
  annual:   { fallbackPrice: '17,99 €'  },
  lifetime: { fallbackPrice: '149,99 €' },
};

const PLAN_IDS: PlanId[] = ['monthly', 'annual', 'lifetime'];

// ─── Price card ───────────────────────────────────────────────────────────────

function PlanCard({
  id, label, price, sub, badge, selected, onSelect,
}: {
  id: PlanId; label: string; price: string; sub: string; badge: string | null;
  selected: boolean; onSelect: () => void;
}) {
  return (
    <Pressable
      onPress={onSelect}
      className={`flex-1 rounded-2xl border p-4 active:opacity-80 ${
        selected
          ? 'border-gold bg-gold/10'
          : 'border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft'
      }`}
    >
      {badge && (
        <View className="mb-2 self-start rounded-full bg-gold px-2 py-0.5">
          <Text className="text-[9px] font-bold tracking-wider text-ink">{badge}</Text>
        </View>
      )}
      <Text className={`font-serif text-lg ${selected ? 'text-gold' : 'text-ink dark:text-bone'}`}>
        {label}
      </Text>
      <Text className={`text-xl font-bold ${selected ? 'text-gold' : 'text-ink dark:text-bone'}`}>
        {price}
      </Text>
      <Text className="mt-0.5 text-xs text-ink-mute dark:text-bone-soft">{sub}</Text>
    </Pressable>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPackageForPlan(offering: RCOffering | null, plan: PlanId): RCPackage | null {
  if (!offering) return null;
  if (plan === 'monthly') return offering.monthly ?? null;
  if (plan === 'annual')  return offering.annual  ?? null;
  return offering.lifetime ?? offering.availablePackages.find(
    (p) => p.packageType === 'LIFETIME' || p.identifier.includes('lifetime'),
  ) ?? null;
}

function getPriceForPlan(offering: RCOffering | null, plan: PlanId): string {
  const pkg = getPackageForPlan(offering, plan);
  return pkg?.product.priceString ?? PLAN_META[plan].fallbackPrice;
}

// ─── Paywall screen ───────────────────────────────────────────────────────────

export default function PremiumScreen() {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const { offering, isPending, purchase, restore } = usePurchases();

  const PLAN_DISPLAY: Record<PlanId, { label: string; sub: string; badge: string | null }> = {
    monthly:  { label: t('premium.monthly'),  sub: t('premium.perMonth'), badge: null },
    annual:   { label: t('premium.annual'),   sub: t('premium.perYear'),  badge: t('premium.save25') },
    lifetime: { label: t('premium.lifetime'), sub: t('premium.oneTime'),  badge: t('premium.bestValue') },
  };

  const FEATURES = [
    t('premium.features.unlimitedItems'),
    t('premium.features.unlimitedDocs'),
    t('premium.features.ocr'),
    t('premium.features.pdf'),
    t('premium.features.badge'),
    t('premium.features.vault'),
  ];

  const handlePurchase = async () => {
    const pkg = getPackageForPlan(offering, selectedPlan);
    if (!pkg) {
      Alert.alert(t('premium.comingSoonTitle'), t('premium.comingSoonMsg'));
      return;
    }
    try {
      const success = await purchase(pkg);
      if (success) {
        haptic.success();
        Alert.alert(t('premium.welcomeTitle'), t('premium.welcomeMsg'), [
          { text: t('premium.welcomeBtn'), onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('premium.purchaseError'));
    }
  };

  const handleRestore = async () => {
    try {
      const restored = await restore();
      if (restored) {
        Alert.alert(t('premium.restoredTitle'), t('premium.restoredMsg'), [
          { text: t('common.ok'), onPress: () => router.back() },
        ]);
      } else {
        Alert.alert(t('premium.noRestoreTitle'), t('premium.noRestoreMsg'));
      }
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('premium.restoreError'));
    }
  };

  const selectedPrice = getPriceForPlan(offering, selectedPlan);
  const ctaLabel = selectedPlan === 'lifetime'
    ? t('premium.ctaBuy', { price: selectedPrice })
    : t('premium.ctaStart', { price: selectedPrice, period: PLAN_DISPLAY[selectedPlan].sub });

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top', 'bottom']}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        className="absolute right-5 top-14 z-10 rounded-full bg-gray-200 dark:bg-ink-soft p-1.5"
      >
        <X color={colors.inkGray} size={16} />
      </Pressable>

      <ScrollView
        contentContainerClassName="px-6 pb-10 pt-12"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center mb-6">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gold/10 border border-gold/30">
            <Crown color={colors.gold} size={28} />
          </View>
          <Text className="font-serif text-3xl text-ink dark:text-bone">{t('premium.headline')}</Text>
          <Text className="font-serif text-3xl text-gold">{t('premium.subheadline')}</Text>
          <Text className="mt-3 text-center text-ink-mute dark:text-bone-soft">
            {t('premium.tagline')}
          </Text>
        </View>

        {/* Pricing cards */}
        <View className="mb-6 flex-row gap-3">
          {PLAN_IDS.map((id) => (
            <PlanCard
              key={id}
              id={id}
              label={PLAN_DISPLAY[id].label}
              badge={PLAN_DISPLAY[id].badge}
              sub={PLAN_DISPLAY[id].sub}
              price={getPriceForPlan(offering, id)}
              selected={selectedPlan === id}
              onSelect={() => { haptic.selection(); setSelectedPlan(id); }}
            />
          ))}
        </View>

        {/* CTA */}
        <Pressable
          onPress={handlePurchase}
          disabled={isPending}
          className="mb-4 items-center rounded-xl bg-gold py-4 active:opacity-80"
        >
          {isPending
            ? <ActivityIndicator color={colors.ink} />
            : <Text className="font-semibold text-base text-ink">{ctaLabel}</Text>}
        </Pressable>

        {/* Restore */}
        <Pressable onPress={handleRestore} disabled={isPending} className="mb-8 items-center">
          <Text className="text-sm text-ink-mute dark:text-bone-soft">
            {t('premium.restore')}
          </Text>
        </Pressable>

        {/* Features */}
        <View className="rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-5">
          <Text className="mb-4 text-xs uppercase tracking-wider text-gold">{t('premium.includedTitle')}</Text>
          {FEATURES.map((f) => (
            <View key={f} className="flex-row items-start gap-3 mb-3 last:mb-0">
              <View className="mt-0.5 h-4 w-4 items-center justify-center rounded-full bg-gold/20">
                <Check color={colors.gold} size={10} />
              </View>
              <Text className="flex-1 text-sm text-ink dark:text-bone">{f}</Text>
            </View>
          ))}
        </View>

        {/* Legal */}
        <Text className="mt-6 text-center text-xs text-ink-mute dark:text-bone-soft leading-5">
          {t('premium.legal')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
