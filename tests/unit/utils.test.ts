import { describe, it, expect } from 'vitest';
import { formatMoney, priceLabel, slugify, addMoney } from '@/lib/utils';

describe('formatMoney', () => {
  it('formats GBP minor units with no decimals by default', () => {
    expect(formatMoney({ amount: 1100000, currency: 'GBP' })).toBe('£11,000');
  });
  it('supports decimals when asked', () => {
    expect(formatMoney({ amount: 295050, currency: 'GBP' }, { withDecimals: true })).toBe('£2,950.50');
  });
});

describe('priceLabel', () => {
  it('prefixes "From" for from-pricing', () => {
    expect(priceLabel({ price: { amount: 1100000, currency: 'GBP' }, priceDisplay: 'from' })).toBe('From £11,000');
  });
  it('shows the exact price for exact pricing', () => {
    expect(priceLabel({ price: { amount: 420000, currency: 'GBP' }, priceDisplay: 'exact' })).toBe('£4,200');
  });
  it('falls back to "Price on request"', () => {
    expect(priceLabel({ priceDisplay: 'on-request' })).toBe('Price on request');
  });
});

describe('slugify', () => {
  it('normalises accents and spaces', () => {
    expect(slugify('Éternelle Tennis Bracelet')).toBe('eternelle-tennis-bracelet');
  });
});

describe('addMoney', () => {
  it('adds two amounts of the same currency', () => {
    expect(addMoney({ amount: 100, currency: 'GBP' }, { amount: 250, currency: 'GBP' })).toEqual({ amount: 350, currency: 'GBP' });
  });
  it('throws on currency mismatch', () => {
    expect(() => addMoney({ amount: 100, currency: 'GBP' }, { amount: 1, currency: 'USD' })).toThrow();
  });
});
