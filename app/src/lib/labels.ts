import type { ItemCategory, ItemCondition } from '@/types/database';

export const categoryLabel: Record<ItemCategory, string> = {
  handbag:  'Sac',
  sneaker:  'Sneaker',
  watch:    'Montre',
  jewelry:  'Bijou',
  other:    'Autre',
};

export const conditionLabel: Record<ItemCondition, string> = {
  mint: 'Neuf / Jamais porté',
  excellent: 'Excellent',
  good: 'Bon état',
  fair: 'Correct',
  poor: 'Usé',
};
