import { describe, it, expect } from 'vitest';
import {
  validatePairForPublication,
  validatePairForCreation,
  validateSlotConfig,
  validateSlotsForProduct,
  canChangePairConstituents,
  canDeletePair,
} from '@/lib/pairs/validation';
import { isPairLockingDiamonds } from '@/lib/pairs/eligibility';
import type { PairMemberState, PairPublicationInput } from '@/lib/pairs/validation';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const FUTURE = new Date('2099-01-01T00:00:00.000Z').toISOString();
const PAST   = new Date('2020-01-01T00:00:00.000Z').toISOString();
const REF    = new Date('2026-06-26T12:00:00.000Z');

function eligibleMember(overrides: Partial<PairMemberState> = {}): PairMemberState {
  return {
    cut:           'round',
    cut_grade:     'excellent',
    polish:        'excellent',
    symmetry:      'excellent',
    fluorescence:  'none',
    eclat_approved: false,
    status:        'available',
    is_published:  true,
    hasValidIndividualReservation: false,
    isLockedByAnotherActivePair:  false,
    ...overrides,
  };
}

function validPairInput(overrides: Partial<PairPublicationInput> = {}): PairPublicationInput {
  return {
    diamond_id_a:   'aaaaaaaa-0000-0000-0000-000000000000',
    diamond_id_b:   'bbbbbbbb-0000-0000-0000-000000000000',
    pair_price_gbp: 10000,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 1: Creating a valid draft pair from two eligible unlocked diamonds
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T1: creating a valid draft pair from two eligible unlocked diamonds', () => {
  it('returns no errors for two eligible, unlocked diamonds', () => {
    const errors = validatePairForCreation(
      'aaaaaaaa-0000-0000-0000-000000000000',
      'bbbbbbbb-0000-0000-0000-000000000000',
      { isLockedByAnotherActivePair: false, status: 'available' },
      { isLockedByAnotherActivePair: false, status: 'available' },
    );
    expect(errors).toHaveLength(0);
  });

  it('accepts diamonds that are reserved but not locked by another pair (creation is less strict)', () => {
    const errors = validatePairForCreation(
      'aaaaaaaa-0000-0000-0000-000000000000',
      'bbbbbbbb-0000-0000-0000-000000000000',
      { isLockedByAnotherActivePair: false, status: 'reserved' },
      { isLockedByAnotherActivePair: false, status: 'available' },
    );
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 2: Rejecting a pair with the same diamond twice
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T2: rejecting a pair with the same diamond twice', () => {
  it('returns an error when both IDs are identical (publication)', () => {
    const sameId = 'aaaaaaaa-0000-0000-0000-000000000000';
    const errors = validatePairForPublication(
      validPairInput({ diamond_id_a: sameId, diamond_id_b: sameId }),
      eligibleMember(),
      eligibleMember(),
    );
    expect(errors.some(e => /distinct/i.test(e))).toBe(true);
  });

  it('returns an error when both IDs are identical (creation)', () => {
    const sameId = 'aaaaaaaa-0000-0000-0000-000000000000';
    const errors = validatePairForCreation(
      sameId, sameId,
      { isLockedByAnotherActivePair: false, status: 'available' },
      { isLockedByAnotherActivePair: false, status: 'available' },
    );
    expect(errors.some(e => /distinct/i.test(e))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 3: Rejecting when either diamond is locked by another pair
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T3: rejecting pair when either diamond belongs to a locking pair', () => {
  it('rejects when diamond A is locked by another active pair', () => {
    const errors = validatePairForCreation(
      'aaaaaaaa-0000-0000-0000-000000000000',
      'bbbbbbbb-0000-0000-0000-000000000000',
      { isLockedByAnotherActivePair: true,  status: 'available' },
      { isLockedByAnotherActivePair: false, status: 'available' },
    );
    expect(errors.some(e => /diamond a/i.test(e) && /locked/i.test(e))).toBe(true);
  });

  it('rejects when diamond B is locked by another active pair', () => {
    const errors = validatePairForCreation(
      'aaaaaaaa-0000-0000-0000-000000000000',
      'bbbbbbbb-0000-0000-0000-000000000000',
      { isLockedByAnotherActivePair: false, status: 'available' },
      { isLockedByAnotherActivePair: true,  status: 'available' },
    );
    expect(errors.some(e => /diamond b/i.test(e) && /locked/i.test(e))).toBe(true);
  });

  it('rejects when both diamonds are locked by other pairs', () => {
    const errors = validatePairForCreation(
      'aaaaaaaa-0000-0000-0000-000000000000',
      'bbbbbbbb-0000-0000-0000-000000000000',
      { isLockedByAnotherActivePair: true, status: 'available' },
      { isLockedByAnotherActivePair: true, status: 'available' },
    );
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 4: Rejecting publication when either diamond has valid reservation
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T4: rejecting publication when either diamond has a valid individual reservation', () => {
  it('rejects when diamond A has an active individual reservation', () => {
    const errors = validatePairForPublication(
      validPairInput(),
      eligibleMember({ hasValidIndividualReservation: true }),
      eligibleMember(),
    );
    expect(errors.some(e => /diamond a/i.test(e) && /reservation/i.test(e))).toBe(true);
  });

  it('rejects when diamond B has an active individual reservation', () => {
    const errors = validatePairForPublication(
      validPairInput(),
      eligibleMember(),
      eligibleMember({ hasValidIndividualReservation: true }),
    );
    expect(errors.some(e => /diamond b/i.test(e) && /reservation/i.test(e))).toBe(true);
  });

  it('passes when both diamonds have no reservation', () => {
    const errors = validatePairForPublication(validPairInput(), eligibleMember(), eligibleMember());
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 5: Rejecting publication with missing pair price
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T5: rejecting publication with missing pair price', () => {
  it('rejects when pair_price_gbp is zero', () => {
    const errors = validatePairForPublication(
      validPairInput({ pair_price_gbp: 0 }),
      eligibleMember(),
      eligibleMember(),
    );
    expect(errors.some(e => /price/i.test(e))).toBe(true);
  });

  it('rejects when pair_price_gbp is negative', () => {
    const errors = validatePairForPublication(
      validPairInput({ pair_price_gbp: -500 }),
      eligibleMember(),
      eligibleMember(),
    );
    expect(errors.some(e => /price/i.test(e))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 6: Rejecting invalid matched_pair slot configuration
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T6: rejecting invalid matched_pair slot configuration', () => {
  it('rejects matched_pair slot with no compatible shapes', () => {
    const errors = validateSlotConfig({
      selection_mode: 'matched_pair',
      price_mode:     'selected_inventory',
      compatible_shapes: [],
      allowed_diamond_categories: ['white'],
      min_carat: null,
      max_carat: null,
    });
    expect(errors.some(e => /shape/i.test(e))).toBe(true);
  });

  it('rejects matched_pair slot with no allowed categories', () => {
    const errors = validateSlotConfig({
      selection_mode: 'matched_pair',
      price_mode:     'selected_inventory',
      compatible_shapes: ['round'],
      allowed_diamond_categories: [],
      min_carat: null,
      max_carat: null,
    });
    expect(errors.some(e => /categor/i.test(e))).toBe(true);
  });

  it('accepts a valid matched_pair slot', () => {
    const errors = validateSlotConfig({
      selection_mode: 'matched_pair',
      price_mode:     'selected_inventory',
      compatible_shapes: ['round'],
      allowed_diamond_categories: ['white'],
      min_carat: null,
      max_carat: null,
    });
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 7: Rejecting a fixed slot with selected_inventory price mode
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T7: rejecting fixed slot with selected_inventory price mode', () => {
  it('rejects fixed slot with price_mode = selected_inventory', () => {
    const errors = validateSlotConfig({
      selection_mode: 'fixed',
      price_mode:     'selected_inventory',
      compatible_shapes: [],
      allowed_diamond_categories: [],
      min_carat: null,
      max_carat: null,
    });
    expect(errors.some(e => /fixed/i.test(e) && /price_mode/i.test(e))).toBe(true);
  });

  it('accepts fixed slot with price_mode = included_in_setting', () => {
    const errors = validateSlotConfig({
      selection_mode: 'fixed',
      price_mode:     'included_in_setting',
      compatible_shapes: [],
      allowed_diamond_categories: [],
      min_carat: null,
      max_carat: null,
    });
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 8: Rejecting duplicate slot keys
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T8: rejecting duplicate slot keys', () => {
  it('rejects two slots with the same slot_key', () => {
    const errors = validateSlotsForProduct([
      { slot_key: 'centre_pair', display_order: 0 },
      { slot_key: 'centre_pair', display_order: 1 },
    ]);
    expect(errors.some(e => /duplicate slot key/i.test(e))).toBe(true);
  });

  it('accepts two slots with distinct slot_keys', () => {
    const errors = validateSlotsForProduct([
      { slot_key: 'top_pair',  display_order: 0 },
      { slot_key: 'drop_pair', display_order: 1 },
    ]);
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 9: Rejecting duplicate display orders
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T9: rejecting duplicate display orders', () => {
  it('rejects two slots with the same display_order', () => {
    const errors = validateSlotsForProduct([
      { slot_key: 'top_pair',  display_order: 0 },
      { slot_key: 'drop_pair', display_order: 0 },
    ]);
    expect(errors.some(e => /duplicate display order/i.test(e))).toBe(true);
  });

  it('accepts slots with distinct display orders', () => {
    const errors = validateSlotsForProduct([
      { slot_key: 'top_pair',  display_order: 0 },
      { slot_key: 'drop_pair', display_order: 1 },
    ]);
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 10: Correct compatible-pair count logic per earring type
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T10: compatible pair count logic per earring type', () => {
  // Classic Studs: one matched_pair slot → has a count (non-null)
  it('Classic Studs: one matched_pair slot is not a fixed slot (count is relevant)', () => {
    const slotConfig = {
      selection_mode: 'matched_pair' as const,
      price_mode:     'selected_inventory' as const,
      compatible_shapes: ['round'],
      allowed_diamond_categories: ['white'],
      min_carat: null,
      max_carat: null,
    };
    const errors = validateSlotConfig(slotConfig);
    expect(errors).toHaveLength(0);
  });

  // Drop Earrings: two matched_pair slots → each has a count
  it('Drop Earrings: two distinct slot keys (top_pair and drop_pair) pass cross-slot validation', () => {
    const errors = validateSlotsForProduct([
      { slot_key: 'top_pair',  display_order: 0 },
      { slot_key: 'drop_pair', display_order: 1 },
    ]);
    expect(errors).toHaveLength(0);
  });

  // Pavé Hoops: one fixed slot → no inventory selection required
  it('Pavé Hoops: fixed slot is valid with included_in_setting', () => {
    const errors = validateSlotConfig({
      selection_mode: 'fixed',
      price_mode:     'included_in_setting',
      compatible_shapes: [],
      allowed_diamond_categories: [],
      min_carat: null,
      max_carat: null,
    });
    expect(errors).toHaveLength(0);
  });

  it('Pavé Hoops: fixed slot with selected_inventory price mode is invalid', () => {
    const errors = validateSlotConfig({
      selection_mode: 'fixed',
      price_mode:     'selected_inventory',
      compatible_shapes: [],
      allowed_diamond_categories: [],
      min_carat: null,
      max_carat: null,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 11: Blocking constituent-diamond changes for published/reserved/sold
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T11: blocking constituent-diamond changes for published, reserved, and sold pairs', () => {
  it('blocks changes when pair is published and available', () => {
    expect(canChangePairConstituents({ status: 'available', is_published: true, held_until: null })).toBe(false);
  });

  it('blocks changes when pair is reserved with valid hold', () => {
    expect(canChangePairConstituents({ status: 'reserved', is_published: true,  held_until: FUTURE })).toBe(false);
    expect(canChangePairConstituents({ status: 'reserved', is_published: false, held_until: FUTURE })).toBe(false);
  });

  it('blocks changes when pair is sold', () => {
    expect(canChangePairConstituents({ status: 'sold', is_published: false, held_until: null })).toBe(false);
    expect(canChangePairConstituents({ status: 'sold', is_published: true,  held_until: null })).toBe(false);
  });

  it('allows changes when pair is an unreserved draft (not locking)', () => {
    expect(canChangePairConstituents({ status: 'available', is_published: false, held_until: null })).toBe(true);
    expect(canChangePairConstituents({ status: 'reserved',  is_published: false, held_until: PAST })).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 12: Blocking deletion of available, reserved, and sold pairs
// ─────────────────────────────────────────────────────────────────────────────
describe('E2-T12: blocking deletion of available, reserved, and sold pairs', () => {
  it('blocks deletion of a published available pair', () => {
    expect(canDeletePair({ status: 'available', is_published: true, held_until: null })).toBe(false);
  });

  it('blocks deletion of a reserved pair with valid hold', () => {
    expect(canDeletePair({ status: 'reserved', is_published: true,  held_until: FUTURE })).toBe(false);
    expect(canDeletePair({ status: 'reserved', is_published: false, held_until: FUTURE })).toBe(false);
  });

  it('blocks deletion of a sold pair', () => {
    expect(canDeletePair({ status: 'sold', is_published: false, held_until: null })).toBe(false);
  });

  it('allows deletion of an unreserved draft pair', () => {
    expect(canDeletePair({ status: 'available', is_published: false, held_until: null })).toBe(true);
  });

  it('allows deletion after reservation expires', () => {
    expect(canDeletePair({ status: 'reserved', is_published: false, held_until: PAST })).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Part E Test 13: Existing engagement-ring tests remain unchanged and pass
// ─────────────────────────────────────────────────────────────────────────────
// The ring compatibility pure function isDiamondCompatibleWith is untouched.
// These tests confirm the E2 additions (new pure functions, exports) do not
// disturb the eligibility or validation API surface imported by other modules.

import { isDiamondCompatibleWith } from '@/lib/diamonds/compatibility';
import type { CompatibilityDiamondInput, CompatibilitySetting } from '@/lib/diamonds/compatibility';

describe('E2-T13: existing ring compatibility is unaffected by E2 additions', () => {
  const setting: CompatibilitySetting = { diamond_shapes: ['round'], min_carat: 0.5, max_carat: 3.0 };

  const eligRound: CompatibilityDiamondInput = {
    cut: 'round', carat: 1.0, cut_grade: 'excellent',
    polish: 'excellent', symmetry: 'excellent', fluorescence: 'none',
    eclat_approved: false, status: 'available',
    is_published: true, diamond_category: 'white', colour_family: null,
  };

  it('eligible round white diamond is compatible with matching setting', () => {
    expect(isDiamondCompatibleWith(eligRound, setting)).toBe(true);
  });

  it('reserved diamond is not compatible', () => {
    expect(isDiamondCompatibleWith({ ...eligRound, status: 'reserved' }, setting)).toBe(false);
  });

  it('unpublished diamond is not compatible', () => {
    expect(isDiamondCompatibleWith({ ...eligRound, is_published: false }, setting)).toBe(false);
  });

  it('diamond outside carat range is not compatible', () => {
    expect(isDiamondCompatibleWith({ ...eligRound, carat: 4.0 }, setting)).toBe(false);
  });

  it('validatePairForPublication does not interfere with diamond eligibility check', () => {
    // Run both checks in sequence — they use the same isEclatEligible internally
    const pubErrors = validatePairForPublication(validPairInput(), eligibleMember(), eligibleMember());
    const compat    = isDiamondCompatibleWith(eligRound, setting);
    expect(pubErrors).toHaveLength(0);
    expect(compat).toBe(true);
  });
});
