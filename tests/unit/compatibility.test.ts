import { describe, it, expect } from 'vitest';
import { isDiamondCompatible, compatibleDiamonds } from '@/lib/builder/compatibility';
import type { Diamond, RingSetting } from '@/types/diamond';

const setting: RingSetting = {
  id: 's1',
  slug: 'pave-halo',
  name: 'Pavé Halo',
  style: 'halo',
  basePrice: { amount: 320000, currency: 'GBP' },
  metals: ['platinum'],
  compatibleShapes: ['round', 'oval'],
  caratRange: { min: 0.5, max: 2 },
  images: [{ src: '', alt: '' }],
};

function makeDiamond(partial: Partial<Diamond>): Diamond {
  return {
    id: 'd',
    sku: 'sku',
    shape: 'round',
    carat: 1,
    cut: 'Excellent',
    color: 'F',
    clarity: 'VS1',
    price: { amount: 1, currency: 'GBP' },
    certification: { authority: 'GIA' },
    available: true,
    type: 'natural',
    ...partial,
  };
}

describe('isDiamondCompatible', () => {
  it('accepts a compatible shape within carat range', () => {
    expect(isDiamondCompatible(setting, makeDiamond({ shape: 'oval', carat: 1 }))).toBe(true);
  });

  it('rejects an incompatible shape', () => {
    expect(isDiamondCompatible(setting, makeDiamond({ shape: 'emerald' }))).toBe(false);
  });

  it('rejects a stone below the carat minimum', () => {
    expect(isDiamondCompatible(setting, makeDiamond({ carat: 0.3 }))).toBe(false);
  });

  it('rejects a stone above the carat maximum', () => {
    expect(isDiamondCompatible(setting, makeDiamond({ carat: 3 }))).toBe(false);
  });
});

describe('compatibleDiamonds', () => {
  it('filters a list to compatible stones only', () => {
    const list = [
      makeDiamond({ id: '1', shape: 'round', carat: 1 }),
      makeDiamond({ id: '2', shape: 'emerald', carat: 1 }),
      makeDiamond({ id: '3', shape: 'oval', carat: 5 }),
    ];
    const result = compatibleDiamonds(setting, list);
    expect(result.map((d) => d.id)).toEqual(['1']);
  });
});
