import {
  watchSchema, handbagSchema, sneakerSchema, jewelrySchema, otherSchema, itemSchema,
} from '@/features/items/schemas';

// ── Base validation (shared fields) ──────────────────────────────────────────

describe('watchSchema', () => {
  const base = { category: 'watch' as const, name: 'Rolex Daytona', brand: 'Rolex', condition: 'excellent' as const };

  it('accepts valid watch', () => {
    expect(watchSchema.safeParse(base).success).toBe(true);
  });

  it('requires name', () => {
    const result = watchSchema.safeParse({ ...base, name: '' });
    expect(result.success).toBe(false);
  });

  it('requires brand', () => {
    const result = watchSchema.safeParse({ ...base, brand: '' });
    expect(result.success).toBe(false);
  });

  it('accepts optional metadata', () => {
    const result = watchSchema.safeParse({
      ...base,
      metadata: { movement: 'automatic', case_size_mm: 40, year: 2022 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid movement', () => {
    const result = watchSchema.safeParse({
      ...base,
      metadata: { movement: 'solar' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects case_size_mm out of range', () => {
    const tooSmall = watchSchema.safeParse({ ...base, metadata: { case_size_mm: 10 } });
    const tooBig = watchSchema.safeParse({ ...base, metadata: { case_size_mm: 70 } });
    expect(tooSmall.success).toBe(false);
    expect(tooBig.success).toBe(false);
  });
});

describe('handbagSchema', () => {
  const base = { category: 'handbag' as const, name: 'Birkin 30', brand: 'Hermès', condition: 'mint' as const };

  it('accepts valid handbag', () => {
    expect(handbagSchema.safeParse(base).success).toBe(true);
  });

  it('accepts hardware_color enum', () => {
    const result = handbagSchema.safeParse({ ...base, metadata: { hardware_color: 'gold' } });
    expect(result.success).toBe(true);
  });

  it('rejects unknown hardware_color', () => {
    const result = handbagSchema.safeParse({ ...base, metadata: { hardware_color: 'titanium' } });
    expect(result.success).toBe(false);
  });
});

describe('sneakerSchema', () => {
  const base = { category: 'sneaker' as const, name: 'Air Jordan 1', brand: 'Nike', condition: 'good' as const };

  it('accepts valid sneaker', () => {
    expect(sneakerSchema.safeParse(base).success).toBe(true);
  });

  it('accepts valid EU size', () => {
    const result = sneakerSchema.safeParse({ ...base, metadata: { size_eu: 42 } });
    expect(result.success).toBe(true);
  });

  it('rejects EU size out of range', () => {
    const tooSmall = sneakerSchema.safeParse({ ...base, metadata: { size_eu: 10 } });
    const tooBig = sneakerSchema.safeParse({ ...base, metadata: { size_eu: 70 } });
    expect(tooSmall.success).toBe(false);
    expect(tooBig.success).toBe(false);
  });
});

describe('jewelrySchema', () => {
  const base = { category: 'jewelry' as const, name: 'Bague solitaire', brand: 'Cartier', condition: 'excellent' as const };

  it('accepts valid jewelry', () => {
    expect(jewelrySchema.safeParse(base).success).toBe(true);
  });

  it('accepts valid metal enum', () => {
    const result = jewelrySchema.safeParse({ ...base, metadata: { metal: 'platinum' } });
    expect(result.success).toBe(true);
  });

  it('rejects invalid metal', () => {
    const result = jewelrySchema.safeParse({ ...base, metadata: { metal: 'bronze' } });
    expect(result.success).toBe(false);
  });

  it('rejects negative weight', () => {
    const result = jewelrySchema.safeParse({ ...base, metadata: { weight_g: -1 } });
    expect(result.success).toBe(false);
  });
});

describe('otherSchema', () => {
  it('accepts any metadata', () => {
    const result = otherSchema.safeParse({
      category: 'other',
      name: 'Objet rare',
      brand: 'Inconnu',
      condition: 'fair',
      metadata: { anything: true, custom: 'field' },
    });
    expect(result.success).toBe(true);
  });
});

// ── itemSchema discriminated union ────────────────────────────────────────────

describe('itemSchema discriminated union', () => {
  it('routes to correct schema by category', () => {
    const watch = itemSchema.safeParse({ category: 'watch', name: 'Test', brand: 'Brand', condition: 'good' });
    const handbag = itemSchema.safeParse({ category: 'handbag', name: 'Test', brand: 'Brand', condition: 'good' });
    const jewelry = itemSchema.safeParse({ category: 'jewelry', name: 'Test', brand: 'Brand', condition: 'good' });
    expect(watch.success).toBe(true);
    expect(handbag.success).toBe(true);
    expect(jewelry.success).toBe(true);
  });

  it('rejects unknown category', () => {
    const result = itemSchema.safeParse({ category: 'unknown', name: 'Test', brand: 'Brand', condition: 'good' });
    expect(result.success).toBe(false);
  });

  it('applies correct defaults', () => {
    const result = itemSchema.safeParse({ category: 'watch', name: 'Test', brand: 'Brand', condition: 'good' });
    if (!result.success) throw new Error('Should succeed');
    expect(result.data.purchase_currency).toBe('EUR');
  });

  it('rejects purchase_price < 0', () => {
    const result = itemSchema.safeParse({
      category: 'watch', name: 'Test', brand: 'Brand', condition: 'good', purchase_price: -100,
    });
    expect(result.success).toBe(false);
  });
});
