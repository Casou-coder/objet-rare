import { Watch, ShoppingBag, Footprints, Gem, Package } from 'lucide-react-native';
import type { ComponentType } from 'react';
import type { ItemCategory } from '@/types/database';

export const CATEGORY_ICON: Record<ItemCategory, ComponentType<{ color: string; size: number }>> = {
  watch:   Watch,
  handbag: ShoppingBag,
  sneaker: Footprints,
  jewelry: Gem,
  other:   Package,
};
