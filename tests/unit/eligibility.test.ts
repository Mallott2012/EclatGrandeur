import { describe, it, expect } from 'vitest';
import { isEclatEligible } from '@/lib/diamonds/eligibility';

const base = {
  polish:       'excellent',
  symmetry:     'excellent',
  fluorescence: 'none',
  eclat_approved: false,
};

describe('isEclatEligible — round brilliant', () => {
  it('is eligible when all grades excellent/none and cut_grade excellent', () => {
    expect(isEclatEligible({ ...base, cut: 'round', cut_grade: 'excellent' })).toBe(true);
  });

  it('is eligible when grade abbreviations are used (EX / None)', () => {
    expect(isEclatEligible({
      cut: 'round', cut_grade: 'EX',
      polish: 'EX', symmetry: 'EX', fluorescence: 'None',
      eclat_approved: false,
    })).toBe(true);
  });

  it('is not eligible when cut_grade is very_good', () => {
    expect(isEclatEligible({ ...base, cut: 'round', cut_grade: 'VG' })).toBe(false);
  });

  it('is not eligible when cut_grade is null', () => {
    expect(isEclatEligible({ ...base, cut: 'round', cut_grade: null })).toBe(false);
  });

  it('is not eligible when polish is not excellent', () => {
    expect(isEclatEligible({ ...base, cut: 'round', cut_grade: 'excellent', polish: 'VG' })).toBe(false);
  });

  it('is not eligible when symmetry is not excellent', () => {
    expect(isEclatEligible({ ...base, cut: 'round', cut_grade: 'excellent', symmetry: 'G' })).toBe(false);
  });

  it('is not eligible when fluorescence is faint', () => {
    expect(isEclatEligible({ ...base, cut: 'round', cut_grade: 'excellent', fluorescence: 'Faint' })).toBe(false);
  });

  it('is not eligible when any grade is null (polish)', () => {
    expect(isEclatEligible({ ...base, cut: 'round', cut_grade: 'excellent', polish: null })).toBe(false);
  });
});

describe('isEclatEligible — fancy shapes (oval, cushion, pear, radiant, emerald)', () => {
  const fancyShapes = ['oval', 'cushion', 'pear', 'radiant', 'emerald'] as const;

  for (const cut of fancyShapes) {
    it(`${cut}: not eligible without eclat_approved even when all grades pass`, () => {
      expect(isEclatEligible({ ...base, cut, cut_grade: null, eclat_approved: false })).toBe(false);
    });

    it(`${cut}: eligible when all grades pass AND eclat_approved is true`, () => {
      expect(isEclatEligible({ ...base, cut, cut_grade: null, eclat_approved: true })).toBe(true);
    });

    it(`${cut}: not eligible when polish fails even with eclat_approved`, () => {
      expect(isEclatEligible({ ...base, cut, cut_grade: null, polish: 'VG', eclat_approved: true })).toBe(false);
    });

    it(`${cut}: not eligible when fluorescence is not none even with eclat_approved`, () => {
      expect(isEclatEligible({ ...base, cut, cut_grade: null, fluorescence: 'Faint', eclat_approved: true })).toBe(false);
    });
  }
});
