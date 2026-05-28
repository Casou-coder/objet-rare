import { categoryLabel, conditionLabel } from '@/lib/labels';
import type { ItemCategory, ItemCondition } from '@/types/database';

describe('categoryLabel', () => {
  const categories: ItemCategory[] = ['watch', 'handbag', 'sneaker', 'jewelry', 'other'];

  it('has a label for every category', () => {
    categories.forEach((cat) => {
      expect(categoryLabel[cat]).toBeDefined();
      expect(typeof categoryLabel[cat]).toBe('string');
      expect(categoryLabel[cat].length).toBeGreaterThan(0);
    });
  });

  it('returns French labels', () => {
    expect(categoryLabel.watch).toBe('Montre');
    expect(categoryLabel.handbag).toBe('Sac');
    expect(categoryLabel.sneaker).toBe('Sneaker');
    expect(categoryLabel.jewelry).toBe('Bijou');
    expect(categoryLabel.other).toBe('Autre');
  });
});

describe('conditionLabel', () => {
  const conditions: ItemCondition[] = ['mint', 'excellent', 'good', 'fair', 'poor'];

  it('has a label for every condition', () => {
    conditions.forEach((cond) => {
      expect(conditionLabel[cond]).toBeDefined();
      expect(typeof conditionLabel[cond]).toBe('string');
      expect(conditionLabel[cond].length).toBeGreaterThan(0);
    });
  });

  it('returns correct French labels', () => {
    expect(conditionLabel.mint).toBe('Neuf / Jamais porté');
    expect(conditionLabel.excellent).toBe('Excellent');
    expect(conditionLabel.good).toBe('Bon état');
    expect(conditionLabel.fair).toBe('Correct');
    expect(conditionLabel.poor).toBe('Usé');
  });
});
