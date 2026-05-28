import { useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Check, Crown } from 'lucide-react-native';
import { usePurchases } from '@/features/premium/usePurchases';
import type { RCOffering, RCPackage } from '@/features/premium/purchases';
import { colors } from '@/lib/theme';
import { haptic } from '@/lib/haptics';

type PlanId = 'monthly' | 'annual' | 'lifetime';

const PLAN_META: Record<PlanId, { label: string; sub: string; badge: string | null; fallbackPrice: string }> = {
  monthly:  { label: 'Mensuel',  sub: 'par mois',       badge: null,            fallbackPrice: '1,99 €'  },
  annual:   { label: 'Annuel',   sub: 'par an',         badge: 'ÉCONOMISE 25 %', fallbackPrice: '17,99 €' },
  lifetime: { label: 'À vie',    sub: 'paiement unique', badge: 'BEST VALUE',    fallbackPrice: '150 €'   },
};

const PLAN_IDS: PlanId[] = ['monthly', 'annual', 'lifetime'];

const FEATURES = [
  'Objets illimités',
  'Documents illimités par objet',
  'OCR haute précision sur les documents',
  'Export passeport PDF pour assurance & revente',
  'Badge authenticité certifiée',
  'Sauvegarde chiffrée dans le coffre',
];

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
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const { offering, isPending, purchase, restore } = usePurchases();

  const handlePurchase = async () => {
    const pkg = getPackageForPlan(offering, selectedPlan);
    if (!pkg) {
      Alert.alert('Bientôt disponible', 'Le paiement sera actif lors du lancement officiel de l\'app.');
      return;
    }
    try {
      const success = await purchase(pkg);
      if (success) {
        haptic.success();
        Alert.alert('Bienvenue Premium !', 'Ta collection est maintenant illimitée.', [
          { text: 'Super !', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible de finaliser l\'achat.');
    }
  };

  const handleRestore = async () => {
    try {
      const restored = await restore();
      if (restored) {
        Alert.alert('Accès restauré', 'Ton abonnement Premium est actif.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Aucun achat trouvé', 'Aucun achat Premium n\'est associé à ce compte.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Impossible de restaurer les achats.');
    }
  };

  const selectedPrice = getPriceForPlan(offering, selectedPlan);
  const ctaLabel = selectedPlan === 'lifetime'
    ? `Acheter · ${selectedPrice}`
    : `Commencer · ${selectedPrice} · ${PLAN_META[selectedPlan].sub}`;

  return (
    <SafeAreaView className="flex-1 bg-bone dark:bg-ink" edges={['top', 'bottom']}>
      {/* Close button */}
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
          <Text className="font-serif text-3xl text-ink dark:text-bone">Objet Rare</Text>
          <Text className="font-serif text-3xl text-gold">Premium</Text>
          <Text className="mt-3 text-center text-ink-mute dark:text-bone-soft">
            Protège et valorise ta collection{'\n'}sans aucune limite.
          </Text>
        </View>

        {/* Pricing cards */}
        <View className="mb-6 flex-row gap-3">
          {PLAN_IDS.map((id) => (
            <PlanCard
              key={id}
              id={id}
              {...PLAN_META[id]}
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
            Restaurer mes achats
          </Text>
        </Pressable>

        {/* Features */}
        <View className="rounded-2xl border border-gray-200 dark:border-ink-mute bg-white dark:bg-ink-soft p-5">
          <Text className="mb-4 text-xs uppercase tracking-wider text-gold">Inclus dans Premium</Text>
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
          L'abonnement se renouvelle automatiquement. Annulable à tout moment depuis les paramètres
          du Google Play / App Store. L'achat à vie est un paiement unique non remboursable.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
