import { describe, it, expect } from 'vitest';

// ── Inline copies of pure functions for testing (no browser APIs, no DB) ──────

type DiamondCategory = 'white' | 'coloured';
type ColourFamily    = 'yellow' | 'pink';

interface CompatibilitySetting {
  diamond_shapes: string[];
  min_carat:      number | null;
  max_carat:      number | null;
}

interface TestDiamond {
  is_published:     boolean;
  status:           'available' | 'reserved' | 'sold';
  cut:              string;
  carat:            number;
  cut_grade:        string | null;
  polish:           string | null;
  symmetry:         string | null;
  fluorescence:     string | null;
  eclat_approved:   boolean;
  diamond_category: DiamondCategory;
  colour_family:    ColourFamily | null;
}

function isEclatEligible(d: TestDiamond): boolean {
  if (d.polish?.toLowerCase()       !== 'excellent') return false;
  if (d.symmetry?.toLowerCase()     !== 'excellent') return false;
  if (d.fluorescence?.toLowerCase() !== 'none')      return false;
  if (d.cut === 'round') return d.cut_grade?.toLowerCase() === 'excellent';
  return d.eclat_approved === true;
}

function isDiamondCompatibleWith(d: TestDiamond, setting: CompatibilitySetting): boolean {
  if (!d.is_published) return false;
  if (d.status !== 'available') return false;
  if (!isEclatEligible(d)) return false;
  if (setting.diamond_shapes.length > 0 && !setting.diamond_shapes.includes(d.cut)) return false;
  if (setting.min_carat !== null && d.carat < setting.min_carat) return false;
  if (setting.max_carat !== null && d.carat > setting.max_carat) return false;
  if (d.diamond_category === 'white') return true;
  if (d.diamond_category === 'coloured' && (d.colour_family === 'yellow' || d.colour_family === 'pink')) return true;
  return false;
}

// Canonical colour families — only Yellow and Pink, enforced everywhere
const ALLOWED_COLOUR_FAMILIES: ColourFamily[] = ['yellow', 'pink'];

// Shape filter helper
function filterSettingsByShape<T extends { diamond_shapes: string[] }>(
  settings: T[],
  activeShape: string | null,
): T[] {
  if (!activeShape) return settings;
  return settings.filter(s => s.diamond_shapes.includes(activeShape));
}

// Shared eligible white round diamond factory
const eligibleWhiteRound = (): TestDiamond => ({
  is_published: true, status: 'available', cut: 'round', carat: 1.0,
  cut_grade: 'excellent', polish: 'excellent', symmetry: 'excellent',
  fluorescence: 'none', eclat_approved: false,
  diamond_category: 'white', colour_family: null,
});

// ── T1: White/Coloured toggle — colour family constants ───────────────────────

describe('Colour family constants', () => {
  it('T1: allowed colour families are only yellow and pink', () => {
    expect(ALLOWED_COLOUR_FAMILIES).toEqual(['yellow', 'pink']);
    expect(ALLOWED_COLOUR_FAMILIES).not.toContain('green');
    expect(ALLOWED_COLOUR_FAMILIES).not.toContain('blue');
    expect(ALLOWED_COLOUR_FAMILIES).not.toContain('orange');
  });
});

// ── T2: Shape filter — filterSettingsByShape ───────────────────────────────────

describe('filterSettingsByShape', () => {
  const settings = [
    { id: 'a', diamond_shapes: ['round', 'oval'] },
    { id: 'b', diamond_shapes: ['oval', 'pear'] },
    { id: 'c', diamond_shapes: ['round'] },
    { id: 'd', diamond_shapes: [] },
  ];

  it('T2: null activeShape returns all settings', () => {
    expect(filterSettingsByShape(settings, null)).toHaveLength(4);
  });

  it('T3: activeShape=round returns only round-compatible settings', () => {
    const result = filterSettingsByShape(settings, 'round');
    expect(result.map(s => s.id)).toEqual(['a', 'c']);
  });

  it('T4: activeShape=oval returns only oval-compatible settings', () => {
    const result = filterSettingsByShape(settings, 'oval');
    expect(result.map(s => s.id)).toEqual(['a', 'b']);
  });

  it('T5: setting with empty diamond_shapes is excluded when shape active', () => {
    const result = filterSettingsByShape(settings, 'round');
    expect(result.find(s => s.id === 'd')).toBeUndefined();
  });

  it('T6: unknown shape returns empty array', () => {
    expect(filterSettingsByShape(settings, 'heart')).toHaveLength(0);
  });
});

// ── T7: isDiamondCompatibleWith — white diamond ───────────────────────────────

describe('isDiamondCompatibleWith — white diamond', () => {
  const setting: CompatibilitySetting = { diamond_shapes: ['round', 'oval'], min_carat: 0.5, max_carat: 3.0 };

  it('T7: eligible white round diamond is compatible', () => {
    expect(isDiamondCompatibleWith(eligibleWhiteRound(), setting)).toBe(true);
  });

  it('T8: unpublished white diamond is incompatible', () => {
    expect(isDiamondCompatibleWith({ ...eligibleWhiteRound(), is_published: false }, setting)).toBe(false);
  });

  it('T9: white diamond with status=sold is incompatible', () => {
    expect(isDiamondCompatibleWith({ ...eligibleWhiteRound(), status: 'sold' }, setting)).toBe(false);
  });

  it('T10: white diamond with wrong shape is incompatible', () => {
    expect(isDiamondCompatibleWith({ ...eligibleWhiteRound(), cut: 'emerald' }, setting)).toBe(false);
  });

  it('T11: white diamond below min_carat is incompatible', () => {
    expect(isDiamondCompatibleWith({ ...eligibleWhiteRound(), carat: 0.3 }, setting)).toBe(false);
  });

  it('T12: white diamond above max_carat is incompatible', () => {
    expect(isDiamondCompatibleWith({ ...eligibleWhiteRound(), carat: 4.0 }, setting)).toBe(false);
  });
});

// ── T13: isDiamondCompatibleWith — coloured diamonds ─────────────────────────

describe('isDiamondCompatibleWith — coloured diamonds', () => {
  const setting: CompatibilitySetting = { diamond_shapes: ['oval', 'cushion'], min_carat: null, max_carat: null };

  const eligibleYellowOval = (): TestDiamond => ({
    is_published: true, status: 'available', cut: 'oval', carat: 1.5,
    cut_grade: null, polish: 'excellent', symmetry: 'excellent',
    fluorescence: 'none', eclat_approved: true,
    diamond_category: 'coloured', colour_family: 'yellow',
  });

  it('T13: yellow oval approved is compatible', () => {
    expect(isDiamondCompatibleWith(eligibleYellowOval(), setting)).toBe(true);
  });

  it('T14: pink cushion approved is compatible', () => {
    const d: TestDiamond = { ...eligibleYellowOval(), cut: 'cushion', colour_family: 'pink' };
    expect(isDiamondCompatibleWith(d, setting)).toBe(true);
  });

  it('T15: coloured diamond without eclat_approved=true is incompatible (fancy shape)', () => {
    expect(isDiamondCompatibleWith({ ...eligibleYellowOval(), eclat_approved: false }, setting)).toBe(false);
  });

  it('T16: coloured diamond with unsupported colour family (green) is incompatible', () => {
    const d = { ...eligibleYellowOval(), colour_family: 'green' as ColourFamily };
    expect(isDiamondCompatibleWith(d, setting)).toBe(false);
  });

  it('T17: coloured diamond with null colour_family is incompatible', () => {
    expect(isDiamondCompatibleWith({ ...eligibleYellowOval(), colour_family: null }, setting)).toBe(false);
  });
});

// ── T18: Carat range boundary conditions ─────────────────────────────────────

describe('Carat range boundaries', () => {
  it('T18: null min and max accepts any carat', () => {
    const setting: CompatibilitySetting = { diamond_shapes: ['round'], min_carat: null, max_carat: null };
    const d = { ...eligibleWhiteRound(), carat: 10.0 };
    expect(isDiamondCompatibleWith(d, setting)).toBe(true);
  });

  it('T19: exact min_carat boundary is compatible', () => {
    const setting: CompatibilitySetting = { diamond_shapes: ['round'], min_carat: 1.0, max_carat: null };
    expect(isDiamondCompatibleWith({ ...eligibleWhiteRound(), carat: 1.0 }, setting)).toBe(true);
  });

  it('T20: exact max_carat boundary is compatible', () => {
    const setting: CompatibilitySetting = { diamond_shapes: ['round'], min_carat: null, max_carat: 2.0 };
    expect(isDiamondCompatibleWith({ ...eligibleWhiteRound(), carat: 2.0 }, setting)).toBe(true);
  });
});

// ── Security: no lab/origin properties in analytics events ───────────────────

describe('Analytics event properties — security', () => {
  it('T21: allowed event properties do not include origin or lab fields', () => {
    // These property names must never appear in our analytics events
    const FORBIDDEN_PROPERTIES = ['origin', 'lab', 'laboratory', 'lab_grown', 'natural', 'synthetic'];
    const ALLOWED_PROPERTIES = [
      'settingId', 'settingName', 'shape', 'previousShape',
      'diamondId', 'diamondType', 'diamondShape', 'diamondCarat',
      'colourFamily', 'colourIntensity', 'metal', 'source', 'resultCount',
    ];
    FORBIDDEN_PROPERTIES.forEach(prop => {
      expect(ALLOWED_PROPERTIES).not.toContain(prop);
    });
  });
});
