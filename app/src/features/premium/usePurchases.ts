import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/stores/auth';
import {
  getOfferings, purchasePackage, restorePurchases, isPremiumEntitled,
  type RCOffering, type RCPackage,
} from './purchases';

export function usePurchases() {
  const [offering, setOffering] = useState<RCOffering | null>(null);
  const [isPending, setIsPending] = useState(false);
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    getOfferings().then(setOffering).catch(() => {});
  }, []);

  const invalidatePlan = () => {
    qc.invalidateQueries({ queryKey: ['customer-info', user?.id] });
  };

  const purchase = async (pkg: RCPackage): Promise<boolean> => {
    setIsPending(true);
    try {
      const info = await purchasePackage(pkg);
      const entitled = isPremiumEntitled(info);
      if (entitled) invalidatePlan();
      return entitled;
    } catch (e: any) {
      if (!e.userCancelled) throw e;
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const restore = async (): Promise<boolean> => {
    setIsPending(true);
    try {
      const info = await restorePurchases();
      const entitled = isPremiumEntitled(info);
      if (entitled) invalidatePlan();
      return entitled;
    } finally {
      setIsPending(false);
    }
  };

  return { offering, isPending, purchase, restore };
}
