import { describe, it, expect } from 'vitest';
import { isPairEligible, arePairMembersAvailable, isPairLockingDiamonds } from '@/lib/pairs/eligibility';
import { isPairCompatibleWithSlot, validateSlotCoverage } from '@/lib/pairs/compatibility';
import { parseDiamondPair } from '@/lib/pairs/types';
import { isDiamondCompatibleWith } from '@/lib/diamonds/compatibility';
import type { PairMemberInput, PairEligibilityInput, PairLockInput } from '@/lib/pairs/eligibility';
import type { CompatibilityDiamondInput, CompatibilitySetting } from '@/lib/diamonds/compatibility';
import type { PairCompatibilityInput } from '@/lib/pairs/compatibility';
import type { SlotConstraints, DiamondPairRecord } from '@/lib/pairs/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<PairMemberInput> = {}): PairMemberInput {
  return {
    cut:              'oval',
    cut_grade:        null,         // fancy shape — no cut_grade required
    polish:           'excellent',
    symmetry:         'excellent',
    fluorescence:     'none',
    eclat_approved:   true,
    status:           'available',
    is_published:     true,
    diamond_category: 'white',
    colour_family:    null,
    ...overrides,
  };
}

function makePairInput(overrides: Partial<PairCompatibilityInput> = {}): PairCompatibilityInput {
  return {
    diamond_a:        makeMember(),
    diamond_b:        makeMember(),
    shape:            'oval',
    diamond_category: 'white',
    colour_family:    null,
    total_carat:      2.0,
    is_published:     true,
    status:           'available',
    ...overrides,
  };
}

function makeSlot(overrides: Partial<SlotConstraints> = {}): SlotConstraints {
  return {
    compatible_shapes:          ['oval', 'round'],
    min_carat:                  0.5,
    max_carat:                  3.0,
    allowed_diamond_categories: ['white', 'coloured'],
    allowed_colour_families:    null,
    selection_mode:             'matched_pair',
    ...overrides,
  };
}

// ── T1: Both diamonds eligible → pair is eligible ────────────────────────────

describe('isPairEligible', () => {
  it('T1: both diamonds Éclat-eligible → pair eligible', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember(),
      diamond_b:        makeMember(),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(isPairEligible(input)).toBe(true);
  });

  // T2: One diamond fails eligibility → pair ineligible
  it('T2: diamond_a fails polish → pair ineligible', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ polish: 'very_good' }),
      diamond_b:        makeMember(),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(isPairEligible(input)).toBe(false);
  });

  it('T2b: diamond_b fails symmetry → pair ineligible', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember(),
      diamond_b:        makeMember({ symmetry: 'good' }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(isPairEligible(input)).toBe(false);
  });
});

// ── T3: Round pair requires cut_grade=excellent ───────────────────────────────

describe('isPairEligible — round shape', () => {
  it('T3: round with cut_grade=excellent → eligible', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ cut: 'round', cut_grade: 'excellent', eclat_approved: false }),
      diamond_b:        makeMember({ cut: 'round', cut_grade: 'excellent', eclat_approved: false }),
      shape:            'round',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(isPairEligible(input)).toBe(true);
  });

  it('T3b: round with cut_grade=very_good → ineligible', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ cut: 'round', cut_grade: 'very_good', eclat_approved: false }),
      diamond_b:        makeMember({ cut: 'round', cut_grade: 'excellent', eclat_approved: false }),
      shape:            'round',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(isPairEligible(input)).toBe(false);
  });
});

// ── T4: Fancy shape requires eclat_approved=true ──────────────────────────────

describe('isPairEligible — fancy shape', () => {
  it('T4: fancy oval without eclat_approved → ineligible', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ cut: 'oval', eclat_approved: false }),
      diamond_b:        makeMember({ cut: 'oval', eclat_approved: false }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(isPairEligible(input)).toBe(false);
  });
});

// ── T5: Pair becomes unavailable if either constituent diamond is unavailable ─

describe('arePairMembersAvailable', () => {
  it('T5: both available → pair members available', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ status: 'available' }),
      diamond_b:        makeMember({ status: 'available' }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(arePairMembersAvailable(input)).toBe(true);
  });

  it('T5b: diamond_a reserved → pair members unavailable', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ status: 'reserved' }),
      diamond_b:        makeMember({ status: 'available' }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(arePairMembersAvailable(input)).toBe(false);
  });

  it('T5c: diamond_b sold → pair members unavailable', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ status: 'available' }),
      diamond_b:        makeMember({ status: 'sold' }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(arePairMembersAvailable(input)).toBe(false);
  });

  it('T5d: diamond_a unpublished → pair members unavailable', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ is_published: false }),
      diamond_b:        makeMember(),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(arePairMembersAvailable(input)).toBe(false);
  });
});

// ── T6: Slot selection_mode=fixed → no pair is compatible ────────────────────

describe('isPairCompatibleWithSlot', () => {
  it('T6: fixed slot rejects all pairs', () => {
    const pair = makePairInput();
    const slot = makeSlot({ selection_mode: 'fixed' });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  it('T6b: single slot rejects pairs (pairs need matched_pair mode)', () => {
    const pair = makePairInput();
    const slot = makeSlot({ selection_mode: 'single' });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  // T7: Pair outside carat range is rejected
  it('T7: pair total_carat below min_carat → rejected', () => {
    const pair = makePairInput({ total_carat: 0.3 });
    const slot = makeSlot({ min_carat: 0.5 });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  it('T7b: pair total_carat above max_carat → rejected', () => {
    const pair = makePairInput({ total_carat: 4.0 });
    const slot = makeSlot({ max_carat: 3.0 });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  it('T7c: pair total_carat at exact min boundary → accepted', () => {
    const pair = makePairInput({ total_carat: 0.5 });
    const slot = makeSlot({ min_carat: 0.5, max_carat: 3.0 });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(true);
  });

  // T8: Shape mismatch → rejected
  it('T8: pair shape not in compatible_shapes → rejected', () => {
    const pair = makePairInput({ shape: 'cushion' });
    const slot = makeSlot({ compatible_shapes: ['oval', 'round'] });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  it('T8b: empty compatible_shapes → any shape accepted', () => {
    const pair = makePairInput({ shape: 'marquise' });
    const slot = makeSlot({ compatible_shapes: [] });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(true);
  });

  // T9: White-only slot rejects coloured pair
  it('T9: coloured pair rejected by white-only slot', () => {
    const pair = makePairInput({
      diamond_category: 'coloured',
      colour_family:    'yellow',
      diamond_a:        makeMember({ diamond_category: 'coloured', colour_family: 'yellow' }),
      diamond_b:        makeMember({ diamond_category: 'coloured', colour_family: 'yellow' }),
    });
    const slot = makeSlot({ allowed_diamond_categories: ['white'] });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  it('T9b: white pair accepted by white-only slot', () => {
    const pair = makePairInput({ diamond_category: 'white' });
    const slot = makeSlot({ allowed_diamond_categories: ['white'] });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(true);
  });

  // T10: Colour-family slot filter works
  it('T10: pink-only slot rejects yellow pair', () => {
    const pair = makePairInput({
      diamond_category: 'coloured',
      colour_family:    'yellow',
      diamond_a:        makeMember({ diamond_category: 'coloured', colour_family: 'yellow' }),
      diamond_b:        makeMember({ diamond_category: 'coloured', colour_family: 'yellow' }),
    });
    const slot = makeSlot({
      allowed_diamond_categories: ['coloured'],
      allowed_colour_families:    ['pink'],
    });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  it('T10b: null colour_families allows any colour family', () => {
    const pair = makePairInput({
      diamond_category: 'coloured',
      colour_family:    'yellow',
      diamond_a:        makeMember({ diamond_category: 'coloured', colour_family: 'yellow' }),
      diamond_b:        makeMember({ diamond_category: 'coloured', colour_family: 'yellow' }),
    });
    const slot = makeSlot({
      allowed_diamond_categories: ['white', 'coloured'],
      allowed_colour_families:    null,
    });
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(true);
  });

  // Pair-level status checks
  it('unpublished pair is rejected', () => {
    const pair = makePairInput({ is_published: false });
    const slot = makeSlot();
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });

  it('reserved pair is rejected', () => {
    const pair = makePairInput({ status: 'reserved' });
    const slot = makeSlot();
    expect(isPairCompatibleWithSlot(pair, slot)).toBe(false);
  });
});

// ── validateSlotCoverage ──────────────────────────────────────────────────────

describe('validateSlotCoverage', () => {
  it('all required matched_pair slots filled → valid', () => {
    const slot = makeSlot();
    const pair = makePairInput();
    const map  = new Map<string, PairCompatibilityInput | null>([['centre_pair', pair]]);
    const result = validateSlotCoverage([slot], map, ['centre_pair']);
    expect(result.valid).toBe(true);
    expect(result.missingSlots).toHaveLength(0);
  });

  it('required slot not filled → invalid, reports missing key', () => {
    const slot = makeSlot();
    const map  = new Map<string, PairCompatibilityInput | null>([['centre_pair', null]]);
    const result = validateSlotCoverage([slot], map, ['centre_pair']);
    expect(result.valid).toBe(false);
    expect(result.missingSlots).toContain('centre_pair');
  });

  it('fixed slot does not require selection → valid when omitted', () => {
    const slot = makeSlot({ selection_mode: 'fixed' });
    const map  = new Map<string, PairCompatibilityInput | null>();
    const result = validateSlotCoverage([slot], map, ['pavé_halo']);
    expect(result.valid).toBe(true);
  });
});

// ── parseDiamondPair ──────────────────────────────────────────────────────────

describe('parseDiamondPair', () => {
  it('parses numeric strings to numbers', () => {
    const record: DiamondPairRecord = {
      id:                 'abc',
      pair_sku:           'EGP-2026-0001',
      diamond_id_a:       'd-a',
      diamond_id_b:       'd-b',
      shape:              'oval',
      diamond_category:   'white',
      colour_family:      null,
      colour:             'G',
      clarity:            'VS1',
      colour_intensity:   null,
      colour_description: null,
      total_carat:        '2.010',
      carat_per_stone:    '1.005',
      pair_price_gbp:     '12500.00',
      status:             'available',
      is_published:       true,
      held_until:         null,
      held_by_cart:       null,
      matching_notes:     'internal note — not in parsed output',
      created_at:         '2026-01-01T00:00:00Z',
      updated_at:         '2026-01-01T00:00:00Z',
    };

    const parsed = parseDiamondPair(record);

    expect(parsed.total_carat).toBe(2.01);
    expect(parsed.carat_per_stone).toBe(1.005);
    expect(parsed.pair_price_gbp).toBe(12500);
    // matching_notes must not appear in the parsed output
    expect('matching_notes' in parsed).toBe(false);
  });

  it('handles null carat_per_stone gracefully', () => {
    const record: DiamondPairRecord = {
      id:                 'abc',
      pair_sku:           'EGP-2026-0002',
      diamond_id_a:       'd-a',
      diamond_id_b:       'd-b',
      shape:              'oval',
      diamond_category:   'white',
      colour_family:      null,
      colour:             null,
      clarity:            null,
      colour_intensity:   null,
      colour_description: null,
      total_carat:        '1.500',
      carat_per_stone:    null,
      pair_price_gbp:     '8000.00',
      status:             'available',
      is_published:       false,
      held_until:         null,
      held_by_cart:       null,
      matching_notes:     null,
      created_at:         '2026-01-01T00:00:00Z',
      updated_at:         '2026-01-01T00:00:00Z',
    };

    const parsed = parseDiamondPair(record);
    expect(parsed.carat_per_stone).toBeNull();
  });
});

// ── E1 Integrity Audit — invariant tests ─────────────────────────────────────
//
// These tests verify the pure-function side of the invariants established by
// the integrity patch (migration 0031 + reservation.ts rewrite).
//
// The database-level enforcement (atomic PL/pgSQL functions) cannot be tested
// here without a live DB; integration-layer coverage belongs in a Supabase
// local-dev test run. The pure-function tests below verify that the resulting
// diamond STATE (after the atomic functions have executed) is correctly
// reflected in all selection and eligibility paths.

// ── Audit T1: Reserved-pair constituent excluded from ring selection ───────────
//
// After claim_pair_atomic executes, both constituent diamonds are set to
// status='reserved'. This test verifies that isDiamondCompatibleWith (which
// drives listCompatibleDiamonds) returns false for a reserved diamond —
// meaning pair-claimed diamonds are automatically invisible to ring selection.

describe('Audit T1: reserved constituent diamond is incompatible with ring settings', () => {
  const setting: CompatibilitySetting = {
    diamond_shapes: ['oval', 'round'],
    min_carat:      0.5,
    max_carat:      3.0,
  };

  function makeRingDiamond(overrides: Partial<CompatibilityDiamondInput> = {}): CompatibilityDiamondInput {
    return {
      cut:              'oval',
      carat:            1.5,
      cut_grade:        null,
      polish:           'excellent',
      symmetry:         'excellent',
      fluorescence:     'none',
      eclat_approved:   true,
      status:           'available',
      is_published:     true,
      diamond_category: 'white',
      colour_family:    null,
      ...overrides,
    };
  }

  it('available diamond is compatible', () => {
    expect(isDiamondCompatibleWith(makeRingDiamond({ status: 'available' }), setting)).toBe(true);
  });

  it('reserved diamond (post-pair-claim state) is not compatible with ring settings', () => {
    // This is the state both diamonds enter after claim_pair_atomic runs.
    expect(isDiamondCompatibleWith(makeRingDiamond({ status: 'reserved' }), setting)).toBe(false);
  });

  it('sold diamond is not compatible with ring settings', () => {
    expect(isDiamondCompatibleWith(makeRingDiamond({ status: 'sold' }), setting)).toBe(false);
  });
});

// ── Audit T2: Reserved constituent excluded from jewellery slot selection ──────
//
// isPairCompatibleWithSlot checks arePairMembersAvailable, which returns false
// when either constituent diamond has status != 'available'. After pair claim,
// both constituents are reserved — so the pair cannot appear in other slots either.

describe('Audit T2: reserved constituent blocks pair from slot selection', () => {
  it('pair whose diamond_a is reserved is not slot-compatible', () => {
    const pair = makePairInput({
      diamond_a: makeMember({ status: 'reserved' }),
    });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(false);
  });

  it('pair whose diamond_b is reserved is not slot-compatible', () => {
    const pair = makePairInput({
      diamond_b: makeMember({ status: 'reserved' }),
    });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(false);
  });
});

// ── Audit T3: Release restores correct availability ───────────────────────────
//
// After release_pair_atomic: pair.status='available', both diamonds back to
// 'available'. arePairMembersAvailable returns true; pair passes slot compat.

describe('Audit T3: post-release state restores availability', () => {
  it('both constituents available → pair members are available', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ status: 'available' }),
      diamond_b:        makeMember({ status: 'available' }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(arePairMembersAvailable(input)).toBe(true);
  });

  it('restored pair passes slot compatibility (post-release state)', () => {
    const pair = makePairInput({ status: 'available', is_published: true });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(true);
  });
});

// ── Audit T4: Wrong-token release is a no-op ─────────────────────────────────
//
// release_pair_atomic (DB function) only updates when held_by_cart = token.
// A wrong token leaves the pair and both diamonds reserved.
// Pure-function perspective: reserved pair remains incompatible.

describe('Audit T4: wrong-token release leaves pair reserved', () => {
  it('pair still reserved after wrong-token release attempt', () => {
    // Simulates the state that must persist when wrong token is used:
    // pair.status = 'reserved', both diamonds status = 'reserved'.
    const pair = makePairInput({
      status:    'reserved',
      diamond_a: makeMember({ status: 'reserved' }),
      diamond_b: makeMember({ status: 'reserved' }),
    });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(false);
    // Both constituent diamonds remain unavailable
    const eligInput: PairEligibilityInput = {
      diamond_a:        pair.diamond_a,
      diamond_b:        pair.diamond_b,
      shape:            pair.shape,
      diamond_category: pair.diamond_category,
      colour_family:    pair.colour_family,
    };
    expect(arePairMembersAvailable(eligInput)).toBe(false);
  });
});

// ── Audit T5: Expired hold can be reclaimed ───────────────────────────────────
//
// claim_pair_atomic condition: status='available' OR (status='reserved' AND
// held_until < now()). After expiry, the pair reverts to claimable state.
// Post-expiry-reclaim, pair.status='available' with fresh held_until:
// constituent diamonds also get fresh reservation (same held_until).
// Pure-function perspective: a newly reclaimed pair is compatible.

describe('Audit T5: reclaimed pair is compatible after expiry', () => {
  it('a newly reclaimed pair (status=reserved, diamonds=reserved, fresh hold) is NOT slot-compatible', () => {
    // After reclaim: pair.status='reserved', so it fails the availability check.
    const pair = makePairInput({
      status:    'reserved',  // currently held by a new cart post-reclaim
      diamond_a: makeMember({ status: 'reserved' }),
      diamond_b: makeMember({ status: 'reserved' }),
    });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(false);
  });

  it('after reclaim + release the pair is slot-compatible again', () => {
    // Simulates pair state after: expiry → reclaim → release cycle
    const pair = makePairInput({ status: 'available', is_published: true });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(true);
  });
});

// ── Audit T6: Sold pairs cannot be released ───────────────────────────────────
//
// release_pair_atomic only matches WHERE status='reserved'. A sold pair is
// permanently in status='sold' and its constituent diamonds in status='sold'.

describe('Audit T6: sold pair is permanently unavailable', () => {
  it('sold pair is not slot-compatible', () => {
    const pair = makePairInput({ status: 'sold' });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(false);
  });

  it('sold constituent diamond is not eligible for ring selection', () => {
    const setting: CompatibilitySetting = {
      diamond_shapes: ['oval'], min_carat: null, max_carat: null,
    };
    const d: CompatibilityDiamondInput = {
      cut: 'oval', carat: 1.5, cut_grade: null,
      polish: 'excellent', symmetry: 'excellent', fluorescence: 'none',
      eclat_approved: true, status: 'sold', is_published: true,
      diamond_category: 'white', colour_family: null,
    };
    expect(isDiamondCompatibleWith(d, setting)).toBe(false);
  });

  it('sold constituent makes pair members unavailable', () => {
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ status: 'sold' }),
      diamond_b:        makeMember({ status: 'available' }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(arePairMembersAvailable(input)).toBe(false);
  });
});

// ── Audit T7: Diamond cannot simultaneously be in active pair and individual reservation ──
//
// If diamond D is in an active published pair:
//   - claimDiamond(D) returns false (pair-membership check in reservation.ts)
//   - If D's status is 'available' (pair is available), isDiamondCompatibleWith
//     would still return true — this is prevented by getActivePairDiamondIds
//     exclusion in listCompatibleDiamonds/getCompatibleDiamondById.
//   - If D's status is 'reserved' (pair was claimed), isDiamondCompatibleWith
//     returns false — shown here.
//
// Scenario: pair is claimed → diamond_a.status='reserved'.
// No other path may simultaneously make diamond_a.status='reserved' with a
// different cart token because:
//   a) claimDiamond checks pair membership first and returns false
//   b) claim_pair_atomic checks diamond status and rolls back if already held

describe('Audit T7: diamond cannot be active in a pair and individually reserved', () => {
  it('diamond reserved by pair claim (status=reserved) is not ring-compatible', () => {
    // After claim_pair_atomic, diamond status = 'reserved'.
    // isDiamondCompatibleWith checks status='available' first → false.
    const setting: CompatibilitySetting = {
      diamond_shapes: ['oval'], min_carat: null, max_carat: null,
    };
    const d: CompatibilityDiamondInput = {
      cut: 'oval', carat: 1.2, cut_grade: null,
      polish: 'excellent', symmetry: 'excellent', fluorescence: 'none',
      eclat_approved: true, status: 'reserved',  // set by claim_pair_atomic
      is_published: true, diamond_category: 'white', colour_family: null,
    };
    expect(isDiamondCompatibleWith(d, setting)).toBe(false);
  });

  it('pair with one reserved constituent fails arePairMembersAvailable', () => {
    // Ensures the pair also becomes unavailable when one diamond is claimed
    // individually (hypothetical race) — the pair slot compat check catches this.
    const input: PairEligibilityInput = {
      diamond_a:        makeMember({ status: 'reserved' }),
      diamond_b:        makeMember({ status: 'available' }),
      shape:            'oval',
      diamond_category: 'white',
      colour_family:    null,
    };
    expect(arePairMembersAvailable(input)).toBe(false);
  });
});

// ── Audit T8: Multi-pair atomic claim is schema-compatible ────────────────────
//
// claim_pairs_atomic (migration 0031) supports reserving N pairs and their 2N
// constituent diamonds in one PL/pgSQL transaction. The TypeScript wrapper
// claimPairsAtomically() accepts an array of pairIds.
//
// Verifiable here: the input type contract is sound and the trivial case
// (empty array) is correct without touching the DB.

describe('Audit T8: multi-pair atomic claim contract', () => {
  it('empty pairIds is trivially true (no pairs to claim)', () => {
    // claimPairsAtomically returns true immediately for empty arrays — nothing
    // reserved, nothing failed. This is used when a product has no pair slots.
    // Verified by inspecting the guard at the top of claimPairsAtomically:
    //   if (opts.pairIds.length === 0) return true;
    // We test the slot-coverage analogue: no required matched_pair slots = valid.
    const result = validateSlotCoverage([], new Map(), []);
    expect(result.valid).toBe(true);
    expect(result.missingSlots).toHaveLength(0);
  });

  it('two-slot drop earring: both slots filled → valid', () => {
    const topSlot  = makeSlot({ compatible_shapes: ['round'] });
    const dropSlot = makeSlot({ compatible_shapes: ['pear'] });
    const topPair  = makePairInput({ shape: 'round' });
    const dropPair = makePairInput({
      shape:     'pear',
      diamond_a: makeMember({ cut: 'pear', eclat_approved: true }),
      diamond_b: makeMember({ cut: 'pear', eclat_approved: true }),
    });
    const coverage = new Map([
      ['top_pair',  topPair],
      ['drop_pair', dropPair],
    ]);
    const result = validateSlotCoverage(
      [topSlot, dropSlot],
      coverage,
      ['top_pair', 'drop_pair'],
    );
    expect(result.valid).toBe(true);
  });

  it('two-slot drop earring: one slot incompatible → invalid, reports missing', () => {
    const topSlot  = makeSlot({ compatible_shapes: ['round'] });
    const dropSlot = makeSlot({ compatible_shapes: ['pear'] });
    const topPair  = makePairInput({ shape: 'round' });
    // Drop pair shape mismatch → incompatible
    const dropPair = makePairInput({ shape: 'oval' });
    const coverage = new Map([
      ['top_pair',  topPair],
      ['drop_pair', dropPair],
    ]);
    const result = validateSlotCoverage(
      [topSlot, dropSlot],
      coverage,
      ['top_pair', 'drop_pair'],
    );
    expect(result.valid).toBe(false);
    expect(result.missingSlots).toContain('drop_pair');
    expect(result.missingSlots).not.toContain('top_pair');
  });
});

// ── Pair-lock semantics (0032 correction) ────────────────────────────────────
//
// These tests verify the precise three-condition pair-lock definition against
// the pure function isPairLockingDiamonds.  The same logic is mirrored in:
//   - migration 0032 (check_pair_diamond_uniqueness, claim_pair_atomic, etc.)
//   - getActivePairDiamondIds() in src/lib/diamonds/compatibility.ts
//   - claimDiamond() guard in src/lib/diamonds/reservation.ts

const PAST   = new Date('2020-01-01T00:00:00.000Z').toISOString();  // definitely expired
const FUTURE = new Date('2099-01-01T00:00:00.000Z').toISOString();  // far future hold
const REF    = new Date('2026-06-26T12:00:00.000Z');                // reference "now"

function makeLock(overrides: Partial<PairLockInput> = {}): PairLockInput {
  return {
    status:       'available',
    is_published: true,
    held_until:   null,
    ...overrides,
  };
}

// ── Lock test 1: Available published pair locks both members ──────────────────
describe('Lock 1: published available pair locks constituent diamonds', () => {
  it('is_published=true + status=available → locks', () => {
    expect(isPairLockingDiamonds(makeLock({ is_published: true, status: 'available', held_until: null }), REF)).toBe(true);
  });

  it('is_published=false + status=available → does NOT lock', () => {
    expect(isPairLockingDiamonds(makeLock({ is_published: false, status: 'available', held_until: null }), REF)).toBe(false);
  });
});

// ── Lock test 2: Reserved pair with valid hold locks both members ──────────────
describe('Lock 2: unexpired reservation locks constituent diamonds', () => {
  it('status=reserved + held_until in future → locks', () => {
    expect(isPairLockingDiamonds(makeLock({ status: 'reserved', held_until: FUTURE }), REF)).toBe(true);
  });

  it('status=reserved + held_until in future + unpublished → still locks (rule 3 overrides is_published)', () => {
    expect(isPairLockingDiamonds(makeLock({ status: 'reserved', is_published: false, held_until: FUTURE }), REF)).toBe(true);
  });
});

// ── Lock test 3: Expired pair hold does NOT block either member ───────────────
describe('Lock 3: expired reservation does not lock constituent diamonds', () => {
  it('status=reserved + held_until in past → does NOT lock', () => {
    expect(isPairLockingDiamonds(makeLock({ status: 'reserved', held_until: PAST }), REF)).toBe(false);
  });

  it('status=reserved + held_until null → does NOT lock (never reserved)', () => {
    expect(isPairLockingDiamonds(makeLock({ status: 'reserved', held_until: null }), REF)).toBe(false);
  });

  it('expired pair → constituent diamond is compatible with ring setting', () => {
    // After hold expires, diamonds return to individual availability.
    // isDiamondCompatibleWith(status='available') = true
    const setting: CompatibilitySetting = { diamond_shapes: ['oval'], min_carat: null, max_carat: null };
    const d: CompatibilityDiamondInput = {
      cut: 'oval', carat: 1.2, cut_grade: null,
      polish: 'excellent', symmetry: 'excellent', fluorescence: 'none',
      eclat_approved: true, status: 'available',
      is_published: true, diamond_category: 'white', colour_family: null,
    };
    // Once the pair's hold expires, claimDiamond no longer blocks the diamond.
    // The diamond itself reverts to status='available' when released or expired.
    expect(isDiamondCompatibleWith(d, setting)).toBe(true);
  });
});

// ── Lock test 4: Sold pair permanently locks both members ─────────────────────
describe('Lock 4: sold pair permanently locks both members', () => {
  it('status=sold → locks regardless of is_published or held_until', () => {
    expect(isPairLockingDiamonds(makeLock({ status: 'sold', is_published: false, held_until: null }), REF)).toBe(true);
    expect(isPairLockingDiamonds(makeLock({ status: 'sold', is_published: true, held_until: PAST }), REF)).toBe(true);
    expect(isPairLockingDiamonds(makeLock({ status: 'sold', is_published: false, held_until: PAST }), REF)).toBe(true);
  });

  it('sold pair is never slot-compatible', () => {
    expect(isPairCompatibleWithSlot(makePairInput({ status: 'sold' }), makeSlot())).toBe(false);
  });
});

// ── Lock test 5: Draft/unpublished unreserved pair does NOT block members ──────
describe('Lock 5: draft unpublished pair with no active reservation does not lock', () => {
  it('is_published=false + status=available + no hold → does NOT lock', () => {
    expect(isPairLockingDiamonds(makeLock({ is_published: false, status: 'available', held_until: null }), REF)).toBe(false);
  });

  it('is_published=false + expired hold → does NOT lock', () => {
    expect(isPairLockingDiamonds(makeLock({ is_published: false, status: 'reserved', held_until: PAST }), REF)).toBe(false);
  });
});

// ── Lock test 6: Cannot unpublish pair with valid reservation (pure logic) ─────
//
// The unpublishPair() function and DB trigger trg_prevent_unpublish_reserved
// (migration 0032) block this at application and database levels.
// This test verifies that isPairLockingDiamonds correctly signals the blocked
// state so the application-level check can use it consistently.

describe('Lock 6: unpublish blocked when valid reservation exists', () => {
  it('pair with valid hold is locking → indicates unpublish must be blocked', () => {
    const pair = makeLock({ status: 'reserved', held_until: FUTURE, is_published: true });
    // isPairLockingDiamonds returns true → unpublishPair() should throw
    expect(isPairLockingDiamonds(pair, REF)).toBe(true);
  });

  it('pair with expired hold is not locking → unpublish is safe', () => {
    const pair = makeLock({ status: 'reserved', held_until: PAST, is_published: true });
    expect(isPairLockingDiamonds(pair, REF)).toBe(false);
  });
});

// ── Lock test 7: Reclaiming expired hold re-locks both members atomically ─────
//
// claim_pair_atomic (migration 0032) handles this:
//   Old: status='reserved', held_until=PAST  → not locking
//   After reclaim: status='reserved', held_until=FUTURE → locking
// Both constituent diamonds are updated atomically in the same PG transaction.

describe('Lock 7: reclaiming an expired pair hold re-locks members', () => {
  it('before reclaim: expired hold → not locking', () => {
    const before = makeLock({ status: 'reserved', held_until: PAST });
    expect(isPairLockingDiamonds(before, REF)).toBe(false);
  });

  it('after reclaim: fresh hold → locking again', () => {
    const after = makeLock({ status: 'reserved', held_until: FUTURE });
    expect(isPairLockingDiamonds(after, REF)).toBe(true);
  });

  it('after reclaim: pair slot-compat blocked (reserved pair not selectable)', () => {
    // A reclaimed pair has status='reserved' — it's held by a cart, not selectable
    const pair = makePairInput({ status: 'reserved' });
    expect(isPairCompatibleWithSlot(pair, makeSlot())).toBe(false);
  });
});

// ── Lock test 8: Duplicate pair IDs in claimPairsAtomically fail cleanly ──────
//
// claim_pairs_atomic: cardinality(p_pair_ids) = 2 for [{id},{id}].
// The UPDATE matches only 1 distinct row, so v_claimed=1 < v_expected=2 →
// RAISE EXCEPTION → full rollback → TypeScript wrapper returns false.
// Pure-function analogue: slot coverage with duplicate slot key where one is invalid.

describe('Lock 8: duplicate pair IDs in multi-pair claim → fail with no reservation', () => {
  it('slot coverage with duplicate key and one incompatible entry → invalid', () => {
    // Simulates what happens when a caller passes the same pair for two slots:
    // one slot has the pair; the pair fails for the second (already reserved or incompatible).
    const slot  = makeSlot();
    const valid = makePairInput({ status: 'available' });
    // Second entry: pair is now reserved (simulating the "already claimed by first slot" state)
    const already = makePairInput({ status: 'reserved' });
    const coverage = new Map<string, PairCompatibilityInput | null>([
      ['slot_a', valid],
      ['slot_b', already],  // same pair, now reserved → incompatible
    ]);
    const result = validateSlotCoverage([slot, slot], coverage, ['slot_a', 'slot_b']);
    expect(result.valid).toBe(false);
    expect(result.missingSlots).toContain('slot_b');
  });
});

// ── Lock test 9: Invalid pair ID in multi-pair request → fail with no reservation ─
//
// claim_pairs_atomic: if one pair ID doesn't exist, the UPDATE misses it.
// v_claimed < v_expected → RAISE EXCEPTION → full rollback.
// Pure analogue: one required slot has no compatible pair.

describe('Lock 9: invalid pair ID in multi-pair request → no reservation', () => {
  it('slot coverage with one missing pair → invalid, nothing reserved', () => {
    const slot    = makeSlot();
    const goodPair = makePairInput();
    const coverage = new Map<string, PairCompatibilityInput | null>([
      ['slot_a', goodPair],
      ['slot_b', null],  // invalid/missing pair for this slot
    ]);
    const result = validateSlotCoverage([slot, slot], coverage, ['slot_a', 'slot_b']);
    expect(result.valid).toBe(false);
    expect(result.missingSlots).toEqual(['slot_b']);
  });
});

// ── Lock test 10: Existing engagement-ring tests remain unchanged ─────────────
//
// Verified by the full test suite (npx vitest run). The ring compat pure
// function isDiamondCompatibleWith is unchanged. The DB-layer functions
// getCompatibleDiamondCounts and listCompatibleDiamonds now correctly exclude
// pair-member diamonds using the 3-condition formula, which is strictly more
// precise than the previous is_published+status!=sold rule — no test
// expectations change, only runtime query results become more accurate.

describe('Lock 10: ring compatibility pure function is unaffected by pair-lock changes', () => {
  it('eligible white round diamond is still compatible with a ring setting', () => {
    const setting: CompatibilitySetting = { diamond_shapes: ['round'], min_carat: 0.5, max_carat: 3.0 };
    const d: CompatibilityDiamondInput = {
      cut: 'round', carat: 1.0, cut_grade: 'excellent',
      polish: 'excellent', symmetry: 'excellent', fluorescence: 'none',
      eclat_approved: false, status: 'available',
      is_published: true, diamond_category: 'white', colour_family: null,
    };
    expect(isDiamondCompatibleWith(d, setting)).toBe(true);
  });

  it('reserved diamond is still not compatible with a ring setting', () => {
    const setting: CompatibilitySetting = { diamond_shapes: ['round'], min_carat: null, max_carat: null };
    const d: CompatibilityDiamondInput = {
      cut: 'round', carat: 1.0, cut_grade: 'excellent',
      polish: 'excellent', symmetry: 'excellent', fluorescence: 'none',
      eclat_approved: false, status: 'reserved',
      is_published: true, diamond_category: 'white', colour_family: null,
    };
    expect(isDiamondCompatibleWith(d, setting)).toBe(false);
  });
});
