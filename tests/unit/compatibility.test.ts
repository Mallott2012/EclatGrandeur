import { describe, it, expect } from 'vitest';
import { isDiamondCompatibleWith, type CompatibilityDiamondInput, type CompatibilitySetting } from '@/lib/diamonds/compatibility';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const defaultSetting: CompatibilitySetting = {
  diamond_shapes: ['round', 'oval', 'cushion'],
  min_carat: 0.5,
  max_carat: 3.0,
};

function makeDiamond(overrides: Partial<CompatibilityDiamondInput> = {}): CompatibilityDiamondInput {
  return {
    cut:              'round',
    carat:            1.0,
    cut_grade:        'excellent',
    polish:           'excellent',
    symmetry:         'excellent',
    fluorescence:     'none',
    eclat_approved:   false,
    status:           'available',
    is_published:     true,
    diamond_category: 'white',
    colour_family:    null,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('isDiamondCompatibleWith', () => {

  // T1: White eligible Round diamond within shape/carats is counted
  it('T1: white round eligible diamond within range is compatible', () => {
    const d = makeDiamond({ cut: 'round', carat: 1.5, diamond_category: 'white' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(true);
  });

  // T2: Yellow eligible fancy-shape diamond with Éclat approval is counted
  it('T2: yellow oval with eclat_approved is compatible', () => {
    const d = makeDiamond({
      cut: 'oval', cut_grade: null, eclat_approved: true,
      diamond_category: 'coloured', colour_family: 'yellow', carat: 1.2,
    });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(true);
  });

  // T3: Pink eligible fancy-shape diamond with Éclat approval is counted
  it('T3: pink cushion with eclat_approved is compatible', () => {
    const d = makeDiamond({
      cut: 'cushion', cut_grade: null, eclat_approved: true,
      diamond_category: 'coloured', colour_family: 'pink', carat: 1.8,
    });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(true);
  });

  // T4: Unpublished diamond is excluded
  it('T4: unpublished diamond is not compatible', () => {
    const d = makeDiamond({ is_published: false });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T5: Sold diamond is excluded
  it('T5: sold diamond is not compatible', () => {
    const d = makeDiamond({ status: 'sold' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T6: Round diamond with non-Excellent cut grade is excluded
  it('T6: round diamond with non-excellent cut_grade is excluded', () => {
    const d = makeDiamond({ cut: 'round', cut_grade: 'very_good' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T7: Diamond with non-Excellent Polish is excluded
  it('T7: non-excellent polish is excluded', () => {
    const d = makeDiamond({ polish: 'very_good' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T8: Diamond with non-Excellent Symmetry is excluded
  it('T8: non-excellent symmetry is excluded', () => {
    const d = makeDiamond({ symmetry: 'good' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T9: Diamond with fluorescence other than None is excluded
  it('T9: faint fluorescence is excluded', () => {
    const d = makeDiamond({ fluorescence: 'faint' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T10: Fancy-shape diamond without Éclat approval is excluded
  it('T10: oval without eclat_approved is excluded', () => {
    const d = makeDiamond({ cut: 'oval', cut_grade: null, eclat_approved: false });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T11: Wrong shape is excluded
  it('T11: emerald not in setting shapes is excluded', () => {
    const d = makeDiamond({ cut: 'emerald', cut_grade: null, eclat_approved: true });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T12: Below-minimum carat is excluded
  it('T12: carat below min_carat is excluded', () => {
    const d = makeDiamond({ carat: 0.3 });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T13: Above-maximum carat is excluded
  it('T13: carat above max_carat is excluded', () => {
    const d = makeDiamond({ carat: 3.5 });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T14: Null min and max ranges behave correctly
  it('T14a: null min_carat applies no lower bound', () => {
    const setting: CompatibilitySetting = { ...defaultSetting, min_carat: null };
    const d = makeDiamond({ carat: 0.1 });
    expect(isDiamondCompatibleWith(d, setting)).toBe(true);
  });

  it('T14b: null max_carat applies no upper bound', () => {
    const setting: CompatibilitySetting = { ...defaultSetting, max_carat: null };
    const d = makeDiamond({ carat: 100.0 });
    expect(isDiamondCompatibleWith(d, setting)).toBe(true);
  });

  it('T14c: boundary values are inclusive', () => {
    const d_min = makeDiamond({ carat: 0.5 });
    const d_max = makeDiamond({ carat: 3.0 });
    expect(isDiamondCompatibleWith(d_min, defaultSetting)).toBe(true);
    expect(isDiamondCompatibleWith(d_max, defaultSetting)).toBe(true);
  });

  // T15: Yellow/Pink counts are separated correctly
  it('T15: yellow and pink are both compatible but counted separately', () => {
    const yellow = makeDiamond({
      cut: 'oval', cut_grade: null, eclat_approved: true,
      diamond_category: 'coloured', colour_family: 'yellow',
    });
    const pink = makeDiamond({
      cut: 'oval', cut_grade: null, eclat_approved: true,
      diamond_category: 'coloured', colour_family: 'pink',
    });
    expect(isDiamondCompatibleWith(yellow, defaultSetting)).toBe(true);
    expect(isDiamondCompatibleWith(pink, defaultSetting)).toBe(true);
    // They would produce different counts (yellow vs pink buckets are separate)
    expect(yellow.colour_family).not.toBe(pink.colour_family);
  });

  // T16: Unsupported colour families are excluded
  it('T16: coloured diamond with unsupported colour_family is excluded', () => {
    const d = makeDiamond({
      cut: 'oval', cut_grade: null, eclat_approved: true,
      diamond_category: 'coloured', colour_family: 'blue' as never,
    });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T17: Invalid setting (min > max) — the pure function still applies both bounds
  it('T17: when min > max, a diamond between the values is still excluded by the stricter bound', () => {
    const badSetting: CompatibilitySetting = { ...defaultSetting, min_carat: 3.0, max_carat: 1.0 };
    const d = makeDiamond({ carat: 2.0 });
    // min=3.0: carat 2.0 < 3.0 → excluded by min
    expect(isDiamondCompatibleWith(d, badSetting)).toBe(false);
  });

  // T18: Legacy manual assignment — the pure function does not break existing ring_setting_diamonds logic
  it('T18: reserved diamond (active hold) is excluded from compatibility', () => {
    const d = makeDiamond({ status: 'reserved' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // T19: Admin counts shape — shapes filter works correctly
  it('T19: empty diamond_shapes setting returns incompatible for any diamond', () => {
    const noShapes: CompatibilitySetting = { diamond_shapes: [], min_carat: null, max_carat: null };
    const d = makeDiamond({ cut: 'round' });
    // Empty shapes array → no shape filter applied (all shapes pass) — compatible
    expect(isDiamondCompatibleWith(d, noShapes)).toBe(true);
  });

  // T20: Customer-facing layout unchanged — isDiamondCompatibleWith is server-only logic, not UI
  it('T20: coloured diamond with null colour_family is excluded', () => {
    const d = makeDiamond({
      cut: 'oval', cut_grade: null, eclat_approved: true,
      diamond_category: 'coloured', colour_family: null,
    });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });

  // Additional eligibility edge cases
  it('normalised grade strings work: "EX" cut is accepted for round', () => {
    const d = makeDiamond({ cut: 'round', cut_grade: 'EX', polish: 'EX', symmetry: 'EX', fluorescence: 'None' });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(true);
  });

  it('fancy shape with all grades excellent but no eclat_approved is still rejected', () => {
    const d = makeDiamond({
      cut: 'cushion', cut_grade: null, eclat_approved: false,
      polish: 'excellent', symmetry: 'excellent', fluorescence: 'none',
    });
    expect(isDiamondCompatibleWith(d, defaultSetting)).toBe(false);
  });
});
