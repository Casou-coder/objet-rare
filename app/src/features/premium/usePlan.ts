import { useMe } from '@/api/hooks';

/**
 * Le plan fait foi côté serveur (décision T7) : l'app ne décide jamais seule d'un accès Premium.
 * Le serveur est synchronisé avec RevenueCat (étape 6).
 */
export function usePlan() {
  const me = useMe();
  const isPremium = me.data?.plan === 'premium';
  return {
    isPremium,
    plan: isPremium ? ('premium' as const) : ('free' as const),
    itemCount: me.data?.limits.items_used ?? 0,
    freeItemLimit: me.data?.limits.free_item_limit ?? 3,
    canAddItem: me.data?.limits.can_add_item ?? false,
  };
}
