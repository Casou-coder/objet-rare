import { formatValue, maskEmail } from '@/lib/format';

// Normalize Unicode whitespace to regular space for locale-agnostic comparisons
const norm = (s: string) => s.replace(/\s/g, ' ');

// ── formatValue ───────────────────────────────────────────────────────────────

describe('formatValue', () => {
  describe('compact: false (default display)', () => {
    it('formats small amounts', () => {
      expect(norm(formatValue(500, '€', false))).toBe('500 €');
    });

    it('formats thousands without shortening', () => {
      expect(norm(formatValue(12000, '€', false))).toBe('12 000 €');
    });

    it('formats millions without shortening', () => {
      const result = norm(formatValue(1500000, '€', false));
      expect(result).toContain('500');
      expect(result).toContain('€');
      expect(result).not.toContain('M');
    });

    it('works with different currency symbols', () => {
      expect(norm(formatValue(100, '$', false))).toBe('100 $');
      expect(norm(formatValue(100, '£', false))).toBe('100 £');
    });
  });

  describe('compact: true', () => {
    it('does not shorten amounts below 10k', () => {
      const result = formatValue(9999, '€', true);
      expect(result).toContain('€');
      expect(result).not.toContain('k');
    });

    it('shortens amounts >= 10k to k', () => {
      const result = formatValue(15000, '€', true);
      expect(result).toContain('k');
      expect(result).toContain('€');
      expect(result).toContain('15');
    });

    it('shortens amounts >= 1M to M', () => {
      const result = formatValue(2500000, '€', true);
      expect(result).toContain('M');
      expect(result).toContain('€');
      expect(result).not.toContain('Md');
    });

    it('shortens amounts >= 1B to Md', () => {
      const result = formatValue(3000000000, '€', true);
      expect(result).toContain('Md');
      expect(result).toContain('€');
    });

    it('rounds k correctly', () => {
      const result = formatValue(25500, '€', true);
      expect(result).toContain('26');
    });

    it('formats M with 1 decimal', () => {
      const result = norm(formatValue(1500000, '€', true));
      expect(result).toMatch(/1[,.]5\s*M/);
    });
  });

  describe('edge cases', () => {
    it('handles zero', () => {
      expect(norm(formatValue(0, '€', false))).toBe('0 €');
      expect(norm(formatValue(0, '€', true))).toBe('0 €');
    });

    it('handles exact 10k threshold', () => {
      const result = formatValue(10000, '€', true);
      expect(result).toContain('k');
    });

    it('handles exact 1M threshold', () => {
      const result = formatValue(1000000, '€', true);
      expect(result).toContain('M');
      expect(result).not.toContain('Md');
    });
  });
});

// ── maskEmail ─────────────────────────────────────────────────────────────────

describe('maskEmail', () => {
  it('masks standard email', () => {
    expect(maskEmail('clement@gmail.com')).toBe('c****@gmail.com');
  });

  it('caps mask at 4 stars for long local parts', () => {
    expect(maskEmail('averylongemail@example.com')).toBe('a****@example.com');
  });

  it('masks short local part (2 chars)', () => {
    expect(maskEmail('ab@test.com')).toBe('a*@test.com');
  });

  it('masks single char local part — no stars', () => {
    expect(maskEmail('a@test.com')).toBe('a@test.com');
  });

  it('returns unchanged if no @ sign', () => {
    expect(maskEmail('notanemail')).toBe('notanemail');
  });

  it('returns unchanged if @ is first char', () => {
    expect(maskEmail('@broken.com')).toBe('@broken.com');
  });

  it('preserves domain exactly', () => {
    const result = maskEmail('user@my-domain.fr');
    expect(result.endsWith('@my-domain.fr')).toBe(true);
  });
});
