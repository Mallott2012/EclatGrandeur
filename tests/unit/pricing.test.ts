import { describe, it, expect } from 'vitest';
import { computeRingPrice } from '@/lib/builder/pricing';
import type { Diamond, RingSetting } from '@/types/diamond';

const setting: RingSetting = {
  id: 's1',
  slug: 'classic-solitaire',
  name: 'Classic Solitaire',
  style: 'solitaire',
  basePrice: { amount: 180000, currency: 'GBP' },
  metals: ['platinum', 'white-gold'],
  metalPriceDelta: { platinum: 20000, 'white-gold': 0 },
  compatibleShapes: ['round'],
  caratRange: { min: 0.3, max: 5 },
  images: [{ src: '', alt: '' }],
};

const diamond: Diamond = {
  id: 'd1',
  sku: 'EG-R-101',
  shape: 'round',
  carat: 1,
  cut: 'Excellent',
  color: 'F',
  clarity: 'VS1',
  price: { amount: 950000, currency: 'GBP' },
  certification: { authority: 'GIA' },
  available: true,
  type: 'natural',
};

describe('computeRingPrice', () => {
  it('sums base price + metal delta + diamond price', () => {
    const total = computeRingPrice(setting, diamond, 'platinum');
    expect(total).toEqual({ amount: 180000 + 20000 + 950000, currency: 'GBP' });
  });

  it('applies a zero delta when metal has none', () => {
    const total = computeRingPrice(setting, diamond, 'white-gold');
    expect(total.amount).toBe(180000 + 950000);
  });

  it('throws on currency mismatch', () => {
    const usdDiamond = { ...diamond, price: { amount: 1, currency: 'USD' as const } };
    expect(() => computeRingPrice(setting, usdDiamond, 'platinum')).toThrow();
  });
});
