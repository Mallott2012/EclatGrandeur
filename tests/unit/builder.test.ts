import { describe, it, expect } from 'vitest';
import { isCompatible, priceBuild } from '@/lib/builder';
import type { Setting, Diamond } from '@/types';

const setting: Setting = {
  id: 'set-x',
  slug: 'aurora',
  name: 'Aurora',
  kind: 'solitaire-ring',
  description: '',
  basePrice: { amount: 180000, currency: 'GBP' },
  metals: ['platinum', 'white-gold', 'yellow-gold', 'rose-gold'],
  shapes: ['round', 'oval', 'emerald'],
};

const roundDiamond: Diamond = {
  id: 'd1',
  shape: 'round',
  carat: 1,
  colour: 'F',
  clarity: 'VS1',
  cut: 'Ideal',
  price: { amount: 900000, currency: 'GBP' },
  report: 'GIA 1',
  authority: 'GIA',
};

const princessDiamond: Diamond = { ...roundDiamond, id: 'd2', shape: 'princess' };

describe('isCompatible', () => {
  it('accepts a shape the setting supports', () => {
    expect(isCompatible(setting, roundDiamond)).toBe(true);
  });
  it('rejects a shape the setting does not support', () => {
    expect(isCompatible(setting, princessDiamond)).toBe(false);
  });
});

describe('priceBuild', () => {
  it('sums setting base + diamond for white gold (no premium)', () => {
    const p = priceBuild(setting, roundDiamond, 'white-gold');
    expect(p.setting.amount).toBe(180000);
    expect(p.diamond.amount).toBe(900000);
    expect(p.total.amount).toBe(1080000);
  });

  it('adds the platinum premium to the setting', () => {
    const p = priceBuild(setting, roundDiamond, 'platinum');
    expect(p.setting.amount).toBe(180000 + 45000);
    expect(p.total.amount).toBe(180000 + 45000 + 900000);
  });

  it('flags builds at or under the threshold as buyable online', () => {
    const p = priceBuild(setting, roundDiamond, 'white-gold');
    expect(p.buyableOnline).toBe(true);
  });

  it('flags very expensive builds as enquiry-only', () => {
    const bigStone: Diamond = { ...roundDiamond, price: { amount: 6_000_000, currency: 'USD' } };
    const p = priceBuild(setting, bigStone, 'platinum');
    expect(p.buyableOnline).toBe(false);
  });
});
