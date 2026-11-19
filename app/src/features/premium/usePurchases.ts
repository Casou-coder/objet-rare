import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getOfferings, purchasePackage, restorePurchases, isPremiumEntitled,
  type RCOffering, type RCPackage,
} from './purchases';

export function usePurchases() {
  const [offering, setOffering] = useState<RCOffering | null>(null);
  const [isPending, setIsPending] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    getOfferings().then(setOffering).catch(() => {});
  }, []);

  // Le plan fait foi côté serveur (/me) ; la synchronisation RevenueCat → serveur arrive à l'étape 6.
  const invalidatePlan = () => {
    qc.invalidateQueries({ queryKey: ['me'] });
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
