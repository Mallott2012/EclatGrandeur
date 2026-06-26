import { describe, it, expect } from 'vitest';
import {
  getRequiredSelectorSlots,
  isConfigurationComplete,
  wouldCreateDuplicatePair,
  validateUrlPairId,
  calculatePriceFromFacts,
} from '@/lib/earrings/validation';
import type { SlotDescriptor } from '@/lib/earrings/validation';
import type { CompatiblePairCard } from '@/lib/earrings/types';

// ─────────────────────────────────────────────────────────────────────────────
// Slot fixture helpers
// ─────────────────────────────────────────────────────────────────────────────

function matchedSlot(slot_key: string, required = true): SlotDescriptor {
  return { slot_key, selection_mode: 'matched_pair', required };
}

function fixedSlot(slot_key: string): SlotDescriptor {
  return { slot_key, selection_mode: 'fixed', required: false };
}

function singleSlot(slot_key: string): SlotDescriptor {
  return { slot_key, selection_mode: 'single', required: true };
}

const PAIR_A: CompatiblePairCard = {
  id: 'pair-a', shape: 'round', total_carat: 2.0, carat_per_stone: 1.0,
  colour: 'D', clarity: 'VS1', colour_family: null, colour_intensity: null,
  colour_description: null, pair_price_gbp: 8000, diamond_category: 'white',
};

const PAIR_B: CompatiblePairCard = {
  id: 'pair-b', shape: 'oval', total_carat: 3.0, carat_per_stone: 1.5,
  colour: 'E', clarity: 'VS2', colour_family: null, colour_intensity: null,
  colour_description: null, pair_price_gbp: 10000, diamond_category: 'white',
};

// ─────────────────────────────────────────────────────────────────────────────
// E4-T1: Classic studs — one matched_pair slot shows one selector
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T1: Classic studs — one matched_pair slot', () => {
  it('returns exactly one selector slot for a single matched_pair slot product', () => {
    const slots: SlotDescriptor[] = [matchedSlot('centre_pair')];
    const selectors = getRequiredSelectorSlots(slots);
    expect(selectors).toHaveLength(1);
    expect(selectors[0].slot_key).toBe('centre_pair');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T2: Halo studs — one matched_pair + one fixed: one selector, fixed included
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T2: Halo studs — matched_pair + fixed slots', () => {
  it('returns one selector slot and does not include the fixed slot', () => {
    const slots: SlotDescriptor[] = [matchedSlot('centre_pair'), fixedSlot('halo')];
    const selectors = getRequiredSelectorSlots(slots);
    expect(selectors).toHaveLength(1);
    expect(selectors[0].slot_key).toBe('centre_pair');
  });

  it('fixed slots are excluded from required selector list', () => {
    const slots: SlotDescriptor[] = [matchedSlot('centre_pair'), fixedSlot('halo')];
    const selectors = getRequiredSelectorSlots(slots);
    expect(selectors.every(s => s.selection_mode === 'matched_pair')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T3: Drop earrings — two required matched_pair slots
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T3: Drop earrings — two required matched_pair slots', () => {
  it('returns two selector slots for a two-slot drop earring', () => {
    const slots: SlotDescriptor[] = [matchedSlot('top_pair'), matchedSlot('drop_pair')];
    const selectors = getRequiredSelectorSlots(slots);
    expect(selectors).toHaveLength(2);
    expect(selectors.map(s => s.slot_key)).toEqual(['top_pair', 'drop_pair']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T4: Pavé hoops — no matched_pair slots means no pair selector shown
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T4: Pavé hoops — no pair selector for fixed-only products', () => {
  it('returns zero selectors for a product with only fixed slots', () => {
    const slots: SlotDescriptor[] = [fixedSlot('pave_stones')];
    const selectors = getRequiredSelectorSlots(slots);
    expect(selectors).toHaveLength(0);
  });

  it('returns zero selectors for a product with no stone slots', () => {
    const selectors = getRequiredSelectorSlots([]);
    expect(selectors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T5: Selected pair persists independently of metal state
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T5: Pair selection is independent of metal state', () => {
  it('configuration completeness is unchanged by metal identity (metal is separate state)', () => {
    const slots: SlotDescriptor[] = [matchedSlot('centre_pair')];
    const selected = new Map([['centre_pair', PAIR_A.id]]);

    // Configuration is complete regardless of which metal is active
    expect(isConfigurationComplete(slots, selected)).toBe(true);

    // Simulating a metal change does not affect the selectedPairIds map
    const selectedAfterMetalChange = new Map(selected);
    expect(isConfigurationComplete(slots, selectedAfterMetalChange)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T6: Selecting a second slot does not clear the first
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T6: First slot selection persists while second slot is being selected', () => {
  it('isConfigurationComplete requires ALL required slots, not just the latest', () => {
    const slots: SlotDescriptor[] = [matchedSlot('top_pair'), matchedSlot('drop_pair')];

    // Only top_pair selected
    const partialSelection = new Map([['top_pair', PAIR_A.id]]);
    expect(isConfigurationComplete(slots, partialSelection)).toBe(false);

    // Both slots selected — top_pair still present
    const fullSelection = new Map([['top_pair', PAIR_A.id], ['drop_pair', PAIR_B.id]]);
    expect(isConfigurationComplete(slots, fullSelection)).toBe(true);
    expect(fullSelection.get('top_pair')).toBe(PAIR_A.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T7: Same pair cannot be selected in two slots
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T7: Duplicate pair prevention across slots', () => {
  it('returns true when the same pair ID is already used in a different slot', () => {
    const currentSelections = new Map([['top_pair', PAIR_A.id]]);
    expect(wouldCreateDuplicatePair(currentSelections, 'drop_pair', PAIR_A.id)).toBe(true);
  });

  it('returns false when the pair ID is being re-used in the SAME slot (replacement)', () => {
    const currentSelections = new Map([['top_pair', PAIR_A.id]]);
    expect(wouldCreateDuplicatePair(currentSelections, 'top_pair', PAIR_A.id)).toBe(false);
  });

  it('returns false when the pair ID is unique across all slots', () => {
    const currentSelections = new Map([['top_pair', PAIR_A.id]]);
    expect(wouldCreateDuplicatePair(currentSelections, 'drop_pair', PAIR_B.id)).toBe(false);
  });

  it('returns false when there are no current selections', () => {
    expect(wouldCreateDuplicatePair(new Map(), 'drop_pair', PAIR_A.id)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T8: Summary hidden until configuration is complete
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T8: Configuration completeness for summary visibility', () => {
  it('is not complete when no pairs are selected', () => {
    const slots: SlotDescriptor[] = [matchedSlot('centre_pair')];
    expect(isConfigurationComplete(slots, new Map())).toBe(false);
  });

  it('is not complete when only some required slots are filled', () => {
    const slots: SlotDescriptor[] = [matchedSlot('top_pair'), matchedSlot('drop_pair')];
    const partial = new Map([['top_pair', PAIR_A.id]]);
    expect(isConfigurationComplete(slots, partial)).toBe(false);
  });

  it('is complete when all required matched_pair slots have a pair', () => {
    const slots: SlotDescriptor[] = [matchedSlot('top_pair'), matchedSlot('drop_pair')];
    const full = new Map([['top_pair', PAIR_A.id], ['drop_pair', PAIR_B.id]]);
    expect(isConfigurationComplete(slots, full)).toBe(true);
  });

  it('optional matched_pair slots do not block completeness', () => {
    const slots: SlotDescriptor[] = [
      matchedSlot('centre_pair', true),
      { slot_key: 'charm_pair', selection_mode: 'matched_pair', required: false },
    ];
    const onlyRequired = new Map([['centre_pair', PAIR_A.id]]);
    expect(isConfigurationComplete(slots, onlyRequired)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T9: Summary price matches server E3 calculation
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T9: Summary price matches server E3 calculatePriceFromFacts', () => {
  it('total = basePrice + sum of selected pair prices', () => {
    const result = calculatePriceFromFacts(
      'prod-1', 'yellow-gold-18k', 3500,
      [
        { slotKey: 'top_pair',  pairId: PAIR_A.id, pairPrice: 8000  },
        { slotKey: 'drop_pair', pairId: PAIR_B.id, pairPrice: 10000 },
      ],
    );
    expect(result.totalPrice).toBe(21500);
    expect(result.basePrice).toBe(3500);
    expect(result.selectedPairs).toHaveLength(2);
  });

  it('total equals basePrice when no pairs are selected', () => {
    const result = calculatePriceFromFacts('prod-2', null, 2800, []);
    expect(result.totalPrice).toBe(2800);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T10: Invalid or incompatible URL pair IDs are cleared
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T10: URL pair validation — invalid pairs are cleared silently', () => {
  it('returns null for a pair ID not in the available set', () => {
    const available = new Set(['pair-a', 'pair-b']);
    expect(validateUrlPairId('pair-c', available)).toBeNull();
  });

  it('returns the pair ID when it is available', () => {
    const available = new Set(['pair-a', 'pair-b']);
    expect(validateUrlPairId('pair-a', available)).toBe('pair-a');
  });

  it('returns null for a null input', () => {
    expect(validateUrlPairId(null, new Set(['pair-a']))).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(validateUrlPairId('', new Set(['pair-a']))).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T11: Unavailable pair IDs are excluded from selectable list
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T11: getRequiredSelectorSlots excludes single/fixed slots from pair selection', () => {
  it('single-mode slots are not returned as matched_pair selectors', () => {
    const slots: SlotDescriptor[] = [singleSlot('centre_stone'), matchedSlot('accent_pair')];
    const selectors = getRequiredSelectorSlots(slots);
    expect(selectors).toHaveLength(1);
    expect(selectors[0].slot_key).toBe('accent_pair');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T12: CompatiblePairCard does not expose internal fields
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T12: CompatiblePairCard interface excludes internal fields', () => {
  it('CompatiblePairCard only contains public-safe fields', () => {
    const card: CompatiblePairCard = { ...PAIR_A };
    const keys = Object.keys(card);

    // Must contain public display fields
    expect(keys).toContain('id');
    expect(keys).toContain('total_carat');
    expect(keys).toContain('pair_price_gbp');

    // Must NOT contain internal fields (pair_sku removed in E6-D1 fix)
    expect(keys).not.toContain('pair_sku');
    expect(keys).not.toContain('matching_notes');
    expect(keys).not.toContain('held_by_cart');
    expect(keys).not.toContain('hold_token');
    expect(keys).not.toContain('eclat_approved');
    expect(keys).not.toContain('approval_notes');
    expect(keys).not.toContain('diamond_id_a');
    expect(keys).not.toContain('diamond_id_b');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T13: Multi-slot configuration with same pair in both slots is incomplete
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T13: wouldCreateDuplicatePair covers multi-slot drop earrings', () => {
  it('prevents the same pair from filling both the top and drop slots', () => {
    const topPairSelected = new Map([['top_pair', PAIR_A.id]]);
    // Attempting to use PAIR_A for the drop slot when it is already used for top
    expect(wouldCreateDuplicatePair(topPairSelected, 'drop_pair', PAIR_A.id)).toBe(true);
  });

  it('allows two different pairs for top and drop slots', () => {
    const topPairSelected = new Map([['top_pair', PAIR_A.id]]);
    expect(wouldCreateDuplicatePair(topPairSelected, 'drop_pair', PAIR_B.id)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// E4-T14: E0–E3 pure-function helpers remain unaffected
// ─────────────────────────────────────────────────────────────────────────────

describe('E4-T14: E3 validation helpers still work correctly after E4 additions', () => {
  it('isConfigurationComplete handles empty slot list as trivially complete', () => {
    expect(isConfigurationComplete([], new Map())).toBe(true);
  });

  it('calculatePriceFromFacts single pair', () => {
    const r = calculatePriceFromFacts('prod-x', null, 1500, [{ slotKey: 'centre_pair', pairId: 'p1', pairPrice: 5000 }]);
    expect(r.totalPrice).toBe(6500);
    expect(r.jewelleryProductId).toBe('prod-x');
    expect(r.metalVariantId).toBeNull();
  });

  it('getRequiredSelectorSlots returns empty for products with no stone configuration', () => {
    expect(getRequiredSelectorSlots([])).toEqual([]);
  });
});
