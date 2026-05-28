import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/auth';
import { useItems } from '@/features/items/hooks';
import { getCustomerInfo, isPremiumEntitled } from './purchases';

export const FREE_LIMITS = { items: 2 } as const;

export function usePlan() {
  const { user } = useAuth();
  const { data: items } = useItems();

  const { data: isPremium = false } = useQuery({
    queryKey: ['customer-info', user?.id],
    queryFn: async () => {
      const info = await getCustomerInfo();
      return isPremiumEntitled(info);
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const itemCount = items?.length ?? 0;

  return {
    isPremium,
    plan: isPremium ? 'premium' as const : 'free' as const,
    itemCount,
    canAddItem: isPremium || itemCount < FREE_LIMITS.items,
  };
}
