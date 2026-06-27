import type { DiamondCategory, ColourFamily } from '@/lib/diamonds/types';
import type { SlotConstraints } from './types';
import type { PairMemberInput } from './eligibility';
import { isPairEligible, arePairMembersAvailable } from './eligibility';

// ── Input type ────────────────────────────────────────────────────────────────

/**
 * The minimum pair fields needed for a compatibility check.
 * Decoupled from DiamondPairRecord so the pure function is testable without DB.
 */
export interface PairCompatibilityInput {
  diamond_a:        PairMemberInput;
  diamond_b:        PairMemberInput;
  shape:            string;
  diamond_category: DiamondCategory;
  colour_family:    ColourFamily | null;
  total_carat:      number;
  is_published:     boolean;
  status:           string;  // PairStatus — string to avoid circular import
}

// ── Pure compatibility check ──────────────────────────────────────────────────

/**
 * Returns true when a pair is selectable in a given stone slot.
 *
 * Rules applied in order (fail-fast):
 *  1. Slot must be in matched_pair mode — fixed and single slots have no pairs.
 *  2. Pair must be published and available (pair-level status).
 *  3. Both constituent diamonds must individually pass Éclat eligibility.
 *  4. Both constituent diamonds must be individually published and available.
 *  5. Shape must match the slot's compatible_shapes list (if non-empty).
 *  6. total_carat must satisfy slot min/max bounds (inclusive).
 *  7. diamond_category must be in allowed_diamond_categories.
 *  8. For coloured pairs, colour_family must be in allowed_colour_families
 *     (null allowed_colour_families = all families permitted).
 *
 * Pure function — testable without database access.
 * Does not duplicate ring compatibility logic; reuses isEclatEligible via
 * isPairEligible and arePairMembersAvailable.
 */
export function isPairCompatibleWithSlot(
  pair: PairCompatibilityInput,
  slot: SlotConstraints,
): boolean {
  // 1. Only matched_pair slots have selectable pairs
  if (slot.selection_mode !== 'matched_pair') return false;

  // 2. Pair-level availability
  if (!pair.is_published) return false;
  if (pair.status !== 'available') return false;

  // 3 & 4. Individual diamond eligibility and availability
  const eligibilityInput = {
    diamond_a:        pair.diamond_a,
    diamond_b:        pair.diamond_b,
    shape:            pair.shape,
    diamond_category: pair.diamond_category,
    colour_family:    pair.colour_family,
  };
  if (!isPairEligible(eligibilityInput)) return false;
  if (!arePairMembersAvailable(eligibilityInput)) return false;

  // 5. Shape
  if (slot.compatible_shapes.length > 0 && !slot.compatible_shapes.includes(pair.shape)) {
    return false;
  }

  // 6. Carat range (inclusive, same convention as ring compatibility)
  if (slot.min_carat !== null && pair.total_carat < slot.min_carat) return false;
  if (slot.max_carat !== null && pair.total_carat > slot.max_carat) return false;

  // 7. Category
  if (!slot.allowed_diamond_categories.includes(pair.diamond_category)) return false;

  // 8. Colour family (only evaluated for coloured pairs)
  if (pair.diamond_category === 'coloured') {
    const families = slot.allowed_colour_families;
    if (families !== null && families !== undefined) {
      if (!pair.colour_family || !families.includes(pair.colour_family)) return false;
    }
  }

  return true;
}

/**
 * Validates all required stone slots in a multi-slot earring configuration.
 *
 * Returns an object keyed by slot_key → true (compatible) | false (no match).
 * Used server-side to verify a complete earring selection before cart submission.
 *
 * Pure function — pass in resolved pairs per slot; no DB access.
 */
export function validateSlotCoverage(
  slots: SlotConstraints[],
  pairsBySlotKey: Map<string, PairCompatibilityInput | null>,
  slotKeys: string[],
): { valid: boolean; missingSlots: string[] } {
  const missingSlots: string[] = [];

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const key  = slotKeys[i];

    if (!key) continue;

    // Fixed slots never require a selected pair
    if (slot.selection_mode === 'fixed') continue;

    const selectedPair = pairsBySlotKey.get(key) ?? null;

    if (!selectedPair || !isPairCompatibleWithSlot(selectedPair, slot)) {
      missingSlots.push(key);
    }
  }

  return { valid: missingSlots.length === 0, missingSlots };
}
