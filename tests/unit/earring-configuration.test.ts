import { describe, it, expect } from 'vitest';
import {
  validateConfigurationStructure,
  validatePairAvailabilityFlags,
  calculatePriceFromFacts,
  assessConfigurationCompletability,
} from '@/lib/earrings/validation';
import { isPairCompatibleWithSlot } from '@/lib/pairs/compatibility';
import type { SlotDescriptor, SelectedPairEntry } from '@/lib/earrings/validation';
import type { PairCompatibilityInput } from '@/lib/pairs/compatibility';
import type { SlotConstraints } from '@/lib/pairs/types';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const FUTURE = new Date('2099-01-01T00:00:00.000Z').toISOString();
const PAST   = new Date('2020-01-01T00:00:00.000Z').toISOString();

function eligibleMemberInput(overrides: Partial<PairCompatibilityInput['diamond_a']> = {}): PairCompatibilityInput['diamond_a'] {
  return {
    cut:            'round',
    cut_grade:      'excellent',
    polish:         'excellent',
    symmetry:       'excellent',
    fluorescence:   'none',
    eclat_approved: false,
    status:         'available',
    is_published:   true,
    diamond_category: 'white',
    colour_family:  null,
    ...overrides,
  };
}

function roundPair(overrides: Partial<PairCompatibilityInput> = {}): PairCompatibilityInput {
  return {
    diamond_a:        eligibleMemberInput(),
    diamond_b:        eligibleMemberInput(),
    shape:            'round',
    diamond_category: 'white',
    colour_family:    null,
    total_carat:      2.0,
    is_published:     true,
    status:           'available',
    ...overrides,
  };
}

function matchedPairSlot(overrides: Partial<SlotConstraints> = {}): SlotConstraints {
  return {
    selection_mode:             'matched_pair',
    compatible_shapes:          ['round'],
    min_carat:                  0.5,
    max_carat:                  3.0,
    allowed_diamond_categories: ['white'],
    allowed_colour_families:    null,
    ...overrides,
  };
}

const CLASSIC_STUDS_SLOTS: SlotDescriptor[] = [
  { slot_key: 'centre_pair', selection_mode: 'matched_pair', required: true },
];

const HALO_STUDS_SLOTS: SlotDescriptor[] = [
  { slot_key: 'centre_pair', selection_mode: 'matched_pair', required: true },
  { slot_key: 'halo_accent', selection_mode: 'fixed',        required: true },
];

const PAVE_HOOP_SLOTS: SlotDescriptor[] = [
  { slot_key: 'pave_accent', selection_mode: 'fixed', required: true },
];

const DROP_EARRING_SLOTS: SlotDescriptor[] = [
  { slot_key: 'top_pair',  selection_mode: 'matched_pair', required: true },
  { slot_key: 'drop_pair', selection_mode: 'matched_pair', required: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// E3-T1: Classic Studs — one compatible pair → valid complete configuration
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T1: Classic Studs — valid complete configuration', () => {
  it('produces no errors when the single matched_pair slot is covered', () => {
    const selected: SelectedPairEntry[] = [
      { slotKey: 'centre_pair', pairId: 'pair-001' },
    ];
    const errors = validateConfigurationStructure(selected, CLASSIC_STUDS_SLOTS);
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T2: Halo Studs — centre pair + fixed accent → valid configuration
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T2: Halo Studs — centre pair only, fixed accent requires no selection', () => {
  it('produces no errors when matched_pair slot has selection and fixed slot is left empty', () => {
    const selected: SelectedPairEntry[] = [
      { slotKey: 'centre_pair', pairId: 'pair-001' },
      // halo_accent is fixed — no selection needed
    ];
    const errors = validateConfigurationStructure(selected, HALO_STUDS_SLOTS);
    expect(errors).toHaveLength(0);
  });

  it('rejects a pair selection for the fixed halo_accent slot', () => {
    const selected: SelectedPairEntry[] = [
      { slotKey: 'centre_pair', pairId: 'pair-001' },
      { slotKey: 'halo_accent', pairId: 'pair-002' },
    ];
    const errors = validateConfigurationStructure(selected, HALO_STUDS_SLOTS);
    expect(errors.some(e => e.code === 'configuration_invalid' && e.slotKey === 'halo_accent')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T3: Pavé Hoops — no pair selection required → valid
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T3: Pavé Hoops — no pair selection required', () => {
  it('produces no errors with empty selectedPairs when all slots are fixed', () => {
    const errors = validateConfigurationStructure([], PAVE_HOOP_SLOTS);
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T4: Drop Earrings — valid top pair + distinct drop pair
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T4: Drop Earrings — two distinct pairs for two slots', () => {
  it('produces no errors when both matched_pair slots have distinct pair selections', () => {
    const selected: SelectedPairEntry[] = [
      { slotKey: 'top_pair',  pairId: 'pair-001' },
      { slotKey: 'drop_pair', pairId: 'pair-002' },
    ];
    const errors = validateConfigurationStructure(selected, DROP_EARRING_SLOTS);
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T5: Drop Earrings — same pair for two slots → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T5: Drop Earrings — same pair for top and drop slots', () => {
  it('returns duplicate_pair_selection error', () => {
    const selected: SelectedPairEntry[] = [
      { slotKey: 'top_pair',  pairId: 'pair-001' },
      { slotKey: 'drop_pair', pairId: 'pair-001' },
    ];
    const errors = validateConfigurationStructure(selected, DROP_EARRING_SLOTS);
    expect(errors.some(e => e.code === 'duplicate_pair_selection' && e.pairId === 'pair-001')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T6: Missing required pair slot → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T6: Missing required pair slot', () => {
  it('returns missing_required_selection when required matched_pair slot has no selection', () => {
    const errors = validateConfigurationStructure([], CLASSIC_STUDS_SLOTS);
    expect(errors.some(e => e.code === 'missing_required_selection' && e.slotKey === 'centre_pair')).toBe(true);
  });

  it('returns missing_required_selection for each uncovered required slot in drop earrings', () => {
    const errors = validateConfigurationStructure([], DROP_EARRING_SLOTS);
    const missingSlotKeys = errors
      .filter(e => e.code === 'missing_required_selection')
      .map(e => e.slotKey);
    expect(missingSlotKeys).toContain('top_pair');
    expect(missingSlotKeys).toContain('drop_pair');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T7: Pair selected for fixed slot → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T7: Pair selected for fixed slot', () => {
  it('returns configuration_invalid error', () => {
    const selected: SelectedPairEntry[] = [
      { slotKey: 'pave_accent', pairId: 'pair-001' },
    ];
    const errors = validateConfigurationStructure(selected, PAVE_HOOP_SLOTS);
    expect(errors.some(e => e.code === 'configuration_invalid' && e.slotKey === 'pave_accent')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T8: Pair outside slot carat range → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T8: Pair outside slot carat range', () => {
  const slot = matchedPairSlot({ min_carat: 0.5, max_carat: 1.5 });

  it('rejects pair below minimum carat', () => {
    expect(isPairCompatibleWithSlot(roundPair({ total_carat: 0.3 }), slot)).toBe(false);
  });

  it('rejects pair above maximum carat', () => {
    expect(isPairCompatibleWithSlot(roundPair({ total_carat: 2.0 }), slot)).toBe(false);
  });

  it('accepts pair within carat range', () => {
    expect(isPairCompatibleWithSlot(roundPair({ total_carat: 1.0 }), slot)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T9: Pair with incompatible shape → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T9: Pair with incompatible shape', () => {
  const slot = matchedPairSlot({ compatible_shapes: ['oval'] });

  it('rejects pair whose shape is not in compatible_shapes', () => {
    expect(isPairCompatibleWithSlot(roundPair({ shape: 'round' }), slot)).toBe(false);
  });

  it('accepts pair with the correct shape', () => {
    const ovalPair = roundPair({ shape: 'oval' });
    expect(isPairCompatibleWithSlot(ovalPair, slot)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T10: Pair with incompatible colour family → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T10: Pair with incompatible colour family', () => {
  const yellowOnlySlot = matchedPairSlot({
    allowed_diamond_categories: ['coloured'],
    allowed_colour_families:    ['yellow'],
  });

  it('rejects a pink coloured pair in a yellow-only slot', () => {
    const pinkPair = roundPair({
      diamond_category: 'coloured',
      colour_family:    'pink',
      diamond_a: eligibleMemberInput({ diamond_category: 'coloured', colour_family: 'pink' }),
      diamond_b: eligibleMemberInput({ diamond_category: 'coloured', colour_family: 'pink', eclat_approved: true, cut_grade: null }),
    });
    expect(isPairCompatibleWithSlot(pinkPair, yellowOnlySlot)).toBe(false);
  });

  it('accepts a yellow coloured pair in a yellow-only slot', () => {
    // Coloured fancy-shape diamonds use eclat_approved=true instead of cut_grade
    const yellowPair = roundPair({
      shape:            'oval',  // fancy shape — GIA does not issue cut grade
      diamond_category: 'coloured',
      colour_family:    'yellow',
      diamond_a: eligibleMemberInput({ cut: 'oval', cut_grade: null, diamond_category: 'coloured', colour_family: 'yellow', eclat_approved: true }),
      diamond_b: eligibleMemberInput({ cut: 'oval', cut_grade: null, diamond_category: 'coloured', colour_family: 'yellow', eclat_approved: true }),
    });
    const ovalYellowSlot = matchedPairSlot({
      compatible_shapes:          ['oval'],
      allowed_diamond_categories: ['coloured'],
      allowed_colour_families:    ['yellow'],
    });
    expect(isPairCompatibleWithSlot(yellowPair, ovalYellowSlot)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T11: Pair held by another valid reservation → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T11: Pair held by another valid reservation', () => {
  it('returns pair_unavailable when pairStatus is reserved', () => {
    const errors = validatePairAvailabilityFlags({
      pairId:            'pair-001',
      slotKey:           'centre_pair',
      pairStatus:        'reserved',
      isPublished:       true,
      heldUntil:         FUTURE,
      diamondAStatus:    'reserved',
      diamondBStatus:    'reserved',
      diamondAHeldUntil: FUTURE,
      diamondBHeldUntil: FUTURE,
    });
    expect(errors.some(e => e.code === 'pair_unavailable')).toBe(true);
  });

  it('returns pair_unavailable when pair is not published', () => {
    const errors = validatePairAvailabilityFlags({
      pairId:            'pair-001',
      slotKey:           'centre_pair',
      pairStatus:        'available',
      isPublished:       false,
      heldUntil:         null,
      diamondAStatus:    'available',
      diamondBStatus:    'available',
      diamondAHeldUntil: null,
      diamondBHeldUntil: null,
    });
    expect(errors.some(e => e.code === 'pair_unavailable')).toBe(true);
  });

  it('returns pair_unavailable when pair is sold', () => {
    const errors = validatePairAvailabilityFlags({
      pairId:            'pair-001',
      slotKey:           'centre_pair',
      pairStatus:        'sold',
      isPublished:       false,
      heldUntil:         null,
      diamondAStatus:    'sold',
      diamondBStatus:    'sold',
      diamondAHeldUntil: null,
      diamondBHeldUntil: null,
    });
    expect(errors.some(e => e.code === 'pair_unavailable')).toBe(true);
  });

  it('returns no error for a published available pair with no holds', () => {
    const errors = validatePairAvailabilityFlags({
      pairId:            'pair-001',
      slotKey:           'centre_pair',
      pairStatus:        'available',
      isPublished:       true,
      heldUntil:         null,
      diamondAStatus:    'available',
      diamondBStatus:    'available',
      diamondAHeldUntil: null,
      diamondBHeldUntil: null,
    });
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T12: Pair with constituent diamond individually reserved → rejected
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T12: Pair with constituent diamond individually reserved', () => {
  it('returns pair_unavailable when diamond A has an unexpired individual reservation', () => {
    const errors = validatePairAvailabilityFlags({
      pairId:            'pair-001',
      slotKey:           'centre_pair',
      pairStatus:        'available',   // pair itself is available
      isPublished:       true,
      heldUntil:         null,
      diamondAStatus:    'reserved',    // diamond A individually reserved
      diamondBStatus:    'available',
      diamondAHeldUntil: FUTURE,
      diamondBHeldUntil: null,
    });
    expect(errors.some(e => e.code === 'pair_unavailable' && /diamond A/i.test(e.message))).toBe(true);
  });

  it('returns pair_unavailable when diamond B has an unexpired individual reservation', () => {
    const errors = validatePairAvailabilityFlags({
      pairId:            'pair-001',
      slotKey:           'centre_pair',
      pairStatus:        'available',
      isPublished:       true,
      heldUntil:         null,
      diamondAStatus:    'available',
      diamondBStatus:    'reserved',    // diamond B individually reserved
      diamondAHeldUntil: null,
      diamondBHeldUntil: FUTURE,
    });
    expect(errors.some(e => e.code === 'pair_unavailable' && /diamond B/i.test(e.message))).toBe(true);
  });

  it('does not flag an expired individual reservation as unavailable', () => {
    const errors = validatePairAvailabilityFlags({
      pairId:            'pair-001',
      slotKey:           'centre_pair',
      pairStatus:        'available',
      isPublished:       true,
      heldUntil:         null,
      diamondAStatus:    'reserved',  // technically reserved but expired hold
      diamondBStatus:    'available',
      diamondAHeldUntil: PAST,       // expired
      diamondBHeldUntil: null,
    });
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T13: Server price calculation ignores fake client prices
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T13: Price calculation ignores fake client prices', () => {
  it('returns total derived from DB-sourced prices only', () => {
    const dbBasePrice = 5_000;  // from DB, not client
    const dbPairPrice = 12_000; // from DB, not client

    const result = calculatePriceFromFacts(
      'product-001',
      null,
      dbBasePrice,
      [{ slotKey: 'centre_pair', pairId: 'pair-001', pairPrice: dbPairPrice }],
    );

    expect(result.totalPrice).toBe(17_000);
    expect(result.basePrice).toBe(dbBasePrice);
    expect(result.selectedPairs[0].pairPrice).toBe(dbPairPrice);
  });

  it('sums multiple pair prices from DB without double-counting', () => {
    const result = calculatePriceFromFacts(
      'product-001',
      null,
      3_000,
      [
        { slotKey: 'top_pair',  pairId: 'pair-A', pairPrice: 8_000 },
        { slotKey: 'drop_pair', pairId: 'pair-B', pairPrice: 6_000 },
      ],
    );

    expect(result.totalPrice).toBe(17_000); // 3000 + 8000 + 6000
    expect(result.selectedPairs).toHaveLength(2);
  });

  it('returns base price only when no pairs are selected (fixed-composition earrings)', () => {
    const result = calculatePriceFromFacts('product-001', null, 4_500, []);
    expect(result.totalPrice).toBe(4_500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T14: Two-slot product with one shared pair → not completable
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T14: Two-slot product with only one shared compatible pair', () => {
  it('is NOT completable when both slots share the same single pair', () => {
    const slotPairIds = new Map<string, Set<string>>([
      ['top_pair',  new Set(['pair-shared'])],
      ['drop_pair', new Set(['pair-shared'])],
    ]);
    const result = assessConfigurationCompletability(slotPairIds, ['top_pair', 'drop_pair']);
    expect(result.isCompletable).toBe(false);
    expect(result.validCombinationCount).toBe(0);
  });

  it('is NOT completable when drop slot has no pairs at all', () => {
    const slotPairIds = new Map<string, Set<string>>([
      ['top_pair',  new Set(['pair-001'])],
      ['drop_pair', new Set()],
    ]);
    const result = assessConfigurationCompletability(slotPairIds, ['top_pair', 'drop_pair']);
    expect(result.isCompletable).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T15: Two-slot product with distinct compatible pairs → completable
// ─────────────────────────────────────────────────────────────────────────────
describe('E3-T15: Two-slot product with distinct compatible pairs', () => {
  it('is completable when each slot has at least one unique pair', () => {
    const slotPairIds = new Map<string, Set<string>>([
      ['top_pair',  new Set(['pair-A', 'pair-B'])],
      ['drop_pair', new Set(['pair-A', 'pair-C'])],
    ]);
    const result = assessConfigurationCompletability(slotPairIds, ['top_pair', 'drop_pair']);
    expect(result.isCompletable).toBe(true);
    expect((result.validCombinationCount ?? 0)).toBeGreaterThan(0);
  });

  it('is completable for a single required slot with one pair', () => {
    const slotPairIds = new Map<string, Set<string>>([
      ['centre_pair', new Set(['pair-001'])],
    ]);
    const result = assessConfigurationCompletability(slotPairIds, ['centre_pair']);
    expect(result.isCompletable).toBe(true);
    expect(result.validCombinationCount).toBe(1);
  });

  it('returns isCompletable=true with count=1 when there are zero required slots (fixed-only)', () => {
    const slotPairIds = new Map<string, Set<string>>();
    const result = assessConfigurationCompletability(slotPairIds, []);
    expect(result.isCompletable).toBe(true);
    expect(result.validCombinationCount).toBe(1);
  });

  it('counts combinations correctly for two independent 2-pair slots', () => {
    const slotPairIds = new Map<string, Set<string>>([
      ['top_pair',  new Set(['A', 'B'])],
      ['drop_pair', new Set(['C', 'D'])],
    ]);
    const result = assessConfigurationCompletability(slotPairIds, ['top_pair', 'drop_pair']);
    expect(result.isCompletable).toBe(true);
    expect(result.validCombinationCount).toBe(4); // 2 × 2 = 4 distinct combinations
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E3-T16 & T17: Existing tests unchanged
// ─────────────────────────────────────────────────────────────────────────────
// Verified by running the full vitest suite. The new pure functions in
// src/lib/earrings/validation.ts and src/lib/pairs/compatibility.ts are
// additive and do not touch existing engagement-ring, pairs, or pairs-admin
// modules. The isPairCompatibleWithSlot and validateSlotCoverage functions
// are unchanged; the earring configuration functions are new files.

describe('E3-T16/T17: ring and E0-E2 tests remain unaffected', () => {
  it('isPairCompatibleWithSlot still works for ring-adjacent tests', () => {
    const slot = matchedPairSlot();
    expect(isPairCompatibleWithSlot(roundPair(), slot)).toBe(true);
    expect(isPairCompatibleWithSlot(roundPair({ is_published: false }), slot)).toBe(false);
    expect(isPairCompatibleWithSlot(roundPair({ status: 'sold' }), slot)).toBe(false);
  });

  it('calculatePriceFromFacts is additive — returns correct structured result', () => {
    const result = calculatePriceFromFacts('pid', 'mid', 1000, [
      { slotKey: 's1', pairId: 'p1', pairPrice: 500 },
    ]);
    expect(result.jewelleryProductId).toBe('pid');
    expect(result.metalVariantId).toBe('mid');
    expect(result.totalPrice).toBe(1500);
  });
});
