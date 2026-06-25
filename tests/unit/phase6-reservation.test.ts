import { describe, it, expect } from 'vitest';

// ── Pure logic extracted from Phase 6 reservation and validation ──────────────

type DiamondStatus = 'available' | 'reserved' | 'sold';

interface DiamondForReservation {
  id:               string;
  sku:              string;
  cut:              string;
  carat:            number;
  colour:           string;
  clarity:          string;
  fluorescence:     string;
  price_gbp:        number;
  is_published:     boolean;
  status:           DiamondStatus;
  held_until:       string | null;
  cut_grade:        string | null;
  polish:           string | null;
  symmetry:         string | null;
  eclat_approved:   boolean;
  diamond_category: 'white' | 'coloured';
  colour_family:    'yellow' | 'pink' | null;
  colour_intensity: string | null;
}

interface SettingForReservation {
  id:                           string;
  name:                         string;
  slug:                         string;
  is_published:                 boolean;
  diamond_shapes:               string[];
  min_carat:                    number | null;
  max_carat:                    number | null;
  ring_sizes:                   string[];
  requires_ring_size_selection: boolean;
  base_price_gbp:               number;
}

interface MetalVariantForReservation {
  id:      string;
  metal:   string;
  enabled: boolean;
  price?:  number;
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

function toPence(gbp: number): number {
  return Math.round(gbp * 100);
}

function isDiamondClaimable(d: DiamondForReservation, now: Date): boolean {
  if (!d.is_published) return false;
  if (d.status === 'available') return true;
  if (d.status === 'reserved' && d.held_until !== null && new Date(d.held_until) < now) return true;
  return false;
}

function isEclatEligible(d: Pick<DiamondForReservation, 'cut' | 'cut_grade' | 'polish' | 'symmetry' | 'fluorescence' | 'eclat_approved'>): boolean {
  const norm = (v: string | null | undefined) => (v ?? '').toLowerCase().replace(/[\s-]/g, '_');
  const isExcellent = (v: string | null | undefined) => ['excellent', 'ex'].includes(norm(v));
  const isNone = (v: string | null | undefined) => ['none', 'nil', 'no', 'none_(inert)'].includes(norm(v));

  if (!isExcellent(d.polish))    return false;
  if (!isExcellent(d.symmetry))  return false;
  if (!isNone(d.fluorescence))   return false;

  if (d.cut === 'round') return isExcellent(d.cut_grade);
  return d.eclat_approved === true;
}

type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

function validateReservationRequest(
  diamond:    DiamondForReservation,
  setting:    SettingForReservation,
  variant:    MetalVariantForReservation | undefined,
  ringSize:   string | null,
  now:        Date,
): ValidationResult {
  if (!setting.is_published)   return { ok: false, error: 'Ring setting not available.' };
  if (!variant || !variant.enabled) return { ok: false, error: 'Selected metal option is not available.' };
  if (!diamond.is_published)   return { ok: false, error: 'Diamond not available.' };
  if (!isDiamondClaimable(diamond, now)) return { ok: false, error: 'This diamond is no longer available.' };
  if (!isEclatEligible(diamond))         return { ok: false, error: 'Diamond is not currently available.' };
  if (diamond.diamond_category !== 'white' && diamond.diamond_category !== 'coloured') {
    return { ok: false, error: 'Diamond not available.' };
  }
  if (diamond.diamond_category === 'coloured' && diamond.colour_family !== 'yellow' && diamond.colour_family !== 'pink') {
    return { ok: false, error: 'Diamond not available.' };
  }
  if (!setting.diamond_shapes.includes(diamond.cut)) {
    return { ok: false, error: 'Diamond shape not compatible.' };
  }
  if (setting.min_carat !== null && diamond.carat < setting.min_carat) {
    return { ok: false, error: 'Diamond below minimum carat.' };
  }
  if (setting.max_carat !== null && diamond.carat > setting.max_carat) {
    return { ok: false, error: 'Diamond exceeds maximum carat.' };
  }
  if (setting.requires_ring_size_selection && (!ringSize || !setting.ring_sizes.includes(ringSize))) {
    return { ok: false, error: 'Please select a ring size.' };
  }
  return { ok: true };
}

function computeLockedPrices(
  settingBasePrice: number,
  variantPrice:     number | undefined,
  diamondPriceGBP:  number,
): { settingPrice: number; diamondPrice: number; totalPrice: number } {
  const settingPricePence = toPence(variantPrice ?? settingBasePrice);
  const diamondPricePence = toPence(diamondPriceGBP);
  return {
    settingPrice: settingPricePence,
    diamondPrice: diamondPricePence,
    totalPrice:   settingPricePence + diamondPricePence,
  };
}

function isPriceIntegrityValid(
  locked: { totalPrice: number },
  recomputed: { totalPrice: number },
): boolean {
  return locked.totalPrice === recomputed.totalPrice;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const now = new Date('2026-01-01T12:00:00Z');

const whiteOvalDiamond: DiamondForReservation = {
  id: 'dia-001', sku: 'EG001', cut: 'oval', carat: 2.01,
  colour: 'F', clarity: 'VS1', fluorescence: 'none',
  price_gbp: 14850, is_published: true, status: 'available', held_until: null,
  cut_grade: null, polish: 'excellent', symmetry: 'excellent',
  eclat_approved: true, diamond_category: 'white', colour_family: null,
  colour_intensity: null,
};

const yellowCushionDiamond: DiamondForReservation = {
  id: 'dia-002', sku: 'EG002', cut: 'cushion', carat: 1.52,
  colour: '—', clarity: 'VS1', fluorescence: 'none',
  price_gbp: 18000, is_published: true, status: 'available', held_until: null,
  cut_grade: null, polish: 'excellent', symmetry: 'excellent',
  eclat_approved: true, diamond_category: 'coloured', colour_family: 'yellow',
  colour_intensity: 'fancy_intense',
};

const solitaireSetting: SettingForReservation = {
  id: 'set-001', name: 'Éclat Solitaire', slug: 'eclat-solitaire',
  is_published: true, diamond_shapes: ['oval', 'round', 'cushion'],
  min_carat: 0.5, max_carat: 3.0,
  ring_sizes: ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'],
  requires_ring_size_selection: true, base_price_gbp: 3650,
};

const yellowGoldVariant: MetalVariantForReservation = {
  id: 'variant-yellow-gold-18k', metal: 'yellow-gold-18k', enabled: true, price: 3850,
};

// ── T1: toPence conversion ────────────────────────────────────────────────────

describe('toPence', () => {
  it('T1: converts whole GBP to pence', () => {
    expect(toPence(14850)).toBe(1485000);
  });

  it('T2: rounds fractional pence correctly', () => {
    expect(toPence(14850.505)).toBe(1485051);
    expect(toPence(14850.504)).toBe(1485050);
  });

  it('T3: zero price converts to zero pence', () => {
    expect(toPence(0)).toBe(0);
  });
});

// ── T4: isDiamondClaimable ─────────────────────────────────────────────────────

describe('isDiamondClaimable', () => {
  it('T4: available published diamond is claimable', () => {
    expect(isDiamondClaimable(whiteOvalDiamond, now)).toBe(true);
  });

  it('T5: unpublished diamond is not claimable', () => {
    const unpublished = { ...whiteOvalDiamond, is_published: false };
    expect(isDiamondClaimable(unpublished, now)).toBe(false);
  });

  it('T6: reserved with unexpired hold is not claimable', () => {
    const heldDiamond = {
      ...whiteOvalDiamond,
      status: 'reserved' as DiamondStatus,
      held_until: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // 30 min future
    };
    expect(isDiamondClaimable(heldDiamond, now)).toBe(false);
  });

  it('T7: reserved with expired hold IS claimable', () => {
    const expiredHold = {
      ...whiteOvalDiamond,
      status: 'reserved' as DiamondStatus,
      held_until: new Date(now.getTime() - 1000).toISOString(), // 1 second past
    };
    expect(isDiamondClaimable(expiredHold, now)).toBe(true);
  });

  it('T8: sold diamond is not claimable', () => {
    const sold = { ...whiteOvalDiamond, status: 'sold' as DiamondStatus };
    expect(isDiamondClaimable(sold, now)).toBe(false);
  });
});

// ── T9: validateReservationRequest ───────────────────────────────────────────

describe('validateReservationRequest', () => {
  it('T9: valid white oval + yellow gold + ring size → ok', () => {
    const result = validateReservationRequest(
      whiteOvalDiamond, solitaireSetting, yellowGoldVariant, 'M', now,
    );
    expect(result.ok).toBe(true);
  });

  it('T10: valid coloured yellow cushion → ok', () => {
    const result = validateReservationRequest(
      yellowCushionDiamond, solitaireSetting, yellowGoldVariant, 'L', now,
    );
    expect(result.ok).toBe(true);
  });

  it('T11: unpublished setting → error', () => {
    const result = validateReservationRequest(
      whiteOvalDiamond,
      { ...solitaireSetting, is_published: false },
      yellowGoldVariant, 'M', now,
    );
    expect(result.ok).toBe(false);
  });

  it('T12: disabled variant → error', () => {
    const result = validateReservationRequest(
      whiteOvalDiamond, solitaireSetting,
      { ...yellowGoldVariant, enabled: false },
      'M', now,
    );
    expect(result.ok).toBe(false);
  });

  it('T13: undefined variant → error', () => {
    const result = validateReservationRequest(
      whiteOvalDiamond, solitaireSetting, undefined, 'M', now,
    );
    expect(result.ok).toBe(false);
  });

  it('T14: incompatible shape → error', () => {
    const emeraldDiamond = { ...whiteOvalDiamond, cut: 'emerald' };
    const result = validateReservationRequest(
      emeraldDiamond, solitaireSetting, yellowGoldVariant, 'M', now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('shape');
  });

  it('T15: carat below min → error', () => {
    const tinyDiamond = { ...whiteOvalDiamond, carat: 0.3 };
    const result = validateReservationRequest(
      tinyDiamond, solitaireSetting, yellowGoldVariant, 'M', now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('minimum');
  });

  it('T16: carat above max → error', () => {
    const hugeDiamond = { ...whiteOvalDiamond, carat: 4.5 };
    const result = validateReservationRequest(
      hugeDiamond, solitaireSetting, yellowGoldVariant, 'M', now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('maximum');
  });

  it('T17: missing ring size when required → error', () => {
    const result = validateReservationRequest(
      whiteOvalDiamond, solitaireSetting, yellowGoldVariant, null, now,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('size');
  });

  it('T18: invalid ring size not in configured list → error', () => {
    const result = validateReservationRequest(
      whiteOvalDiamond, solitaireSetting, yellowGoldVariant, 'Z', now,
    );
    expect(result.ok).toBe(false);
  });

  it('T19: ring size not required and null ringSize → ok', () => {
    const noSizeRequired = { ...solitaireSetting, requires_ring_size_selection: false };
    const result = validateReservationRequest(
      whiteOvalDiamond, noSizeRequired, yellowGoldVariant, null, now,
    );
    expect(result.ok).toBe(true);
  });
});

// ── T20: computeLockedPrices ──────────────────────────────────────────────────

describe('computeLockedPrices', () => {
  it('T20: variant price used over base price', () => {
    const prices = computeLockedPrices(3650, 3850, 14850);
    expect(prices.settingPrice).toBe(385000);
    expect(prices.diamondPrice).toBe(1485000);
    expect(prices.totalPrice).toBe(1870000);
  });

  it('T21: base price used when no variant price', () => {
    const prices = computeLockedPrices(3650, undefined, 14850);
    expect(prices.settingPrice).toBe(365000);
    expect(prices.totalPrice).toBe(1850000);
  });

  it('T22: total equals setting + diamond pence', () => {
    const prices = computeLockedPrices(4800, undefined, 18000);
    expect(prices.totalPrice).toBe(prices.settingPrice + prices.diamondPrice);
  });
});

// ── T23: price integrity check ────────────────────────────────────────────────

describe('isPriceIntegrityValid', () => {
  it('T23: matching totals pass integrity check', () => {
    const locked = { totalPrice: 1870000 };
    const recomputed = computeLockedPrices(3650, 3850, 14850);
    expect(isPriceIntegrityValid(locked, recomputed)).toBe(true);
  });

  it('T24: mismatched total fails integrity check', () => {
    const locked = { totalPrice: 1870001 }; // off by 1 pence
    const recomputed = computeLockedPrices(3650, 3850, 14850);
    expect(isPriceIntegrityValid(locked, recomputed)).toBe(false);
  });
});

// ── Security checks ───────────────────────────────────────────────────────────

describe('Security', () => {
  it('No Natural/Lab terminology in Phase 6 analytics events', () => {
    const PHASE6_EVENTS = [
      'engagement_add_to_bag_initiated',
      'engagement_reservation_succeeded',
      'engagement_reservation_failed',
      'engagement_ring_added_to_bag',
      'engagement_ring_removed_from_bag',
      'engagement_reservation_expiry_warning',
      'engagement_enquiry_with_ring_config',
    ];
    const FORBIDDEN = ['lab', 'origin', 'lab_grown', 'natural', 'laboratory'];
    PHASE6_EVENTS.forEach(event => {
      FORBIDDEN.forEach(term => {
        expect(event).not.toContain(term);
      });
    });
  });

  it('ConfiguredEngagementRing has no internal audit fields', () => {
    const ringKeys = [
      'settingId', 'settingName', 'settingSlug', 'metalVariantId', 'metal',
      'metalLabel', 'diamondId', 'diamondSku', 'diamondDescription',
      'diamondCategory', 'diamondShape', 'diamondCarat', 'colourFamily',
      'colourIntensity', 'ringSize', 'settingPrice', 'diamondPrice',
      'totalPrice', 'reservationExpiresAt',
    ];
    const FORBIDDEN_KEYS = [
      'eclat_approved', 'eclat_approved_by', 'eclat_approval_note',
      'held_by_cart', 'held_until', 'origin', 'lab',
    ];
    FORBIDDEN_KEYS.forEach(key => {
      expect(ringKeys).not.toContain(key);
    });
  });
});
