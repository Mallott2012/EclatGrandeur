import { describe, it, expect } from 'vitest';
import { isPairEligible, arePairMembersAvailable } from '@/lib/pairs/eligibility';
import { isPairCompatibleWithSlot, validateSlotCoverage } from '@/lib/pairs/compatibility';
import { parseDiamondPair } from '@/lib/pairs/types';
import type { PairMemberInput, PairEligibilityInput } from '@/lib/pairs/eligibility';
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
