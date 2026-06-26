// Pure validation functions for diamond pairs and stone slots.
// No database calls — all DB-sourced state is passed in as booleans/values.
// This keeps the functions testable without mocking or DB connections.

import { isEclatEligible } from '@/lib/diamonds/eligibility';
import type { EligibilityInput } from '@/lib/diamonds/eligibility';
import type { DiamondStatus } from '@/lib/diamonds/types';
import type { SlotSelectionMode, SlotPriceMode } from './types';

// ── Pair publication ──────────────────────────────────────────────────────────

export interface PairPublicationInput {
  diamond_id_a:   string;
  diamond_id_b:   string;
  pair_price_gbp: number;
}

/** Subset of diamond state needed to validate pair publication eligibility. */
export interface PairMemberState extends EligibilityInput {
  status:                    DiamondStatus;
  is_published:              boolean;
  hasValidIndividualReservation: boolean;
  isLockedByAnotherActivePair:  boolean;
}

/**
 * Returns a list of human-readable violations preventing publication.
 * Empty list = pair may be published.
 *
 * All DB-derived boolean flags are injected so this function is pure and
 * trivially testable with no mocking.
 */
export function validatePairForPublication(
  pair:    PairPublicationInput,
  memberA: PairMemberState,
  memberB: PairMemberState,
): string[] {
  const errors: string[] = [];

  if (!pair.diamond_id_a || !pair.diamond_id_b) {
    errors.push('Pair must have exactly two constituent diamonds');
  } else if (pair.diamond_id_a === pair.diamond_id_b) {
    errors.push('Constituent diamonds must be distinct');
  }

  if (!pair.pair_price_gbp || pair.pair_price_gbp <= 0) {
    errors.push('Pair price must be greater than zero');
  }

  if (!isEclatEligible(memberA)) errors.push('Diamond A does not meet Éclat eligibility requirements');
  if (!isEclatEligible(memberB)) errors.push('Diamond B does not meet Éclat eligibility requirements');

  if (!memberA.is_published) errors.push('Diamond A is unpublished');
  if (!memberB.is_published) errors.push('Diamond B is unpublished');

  if (memberA.status === 'sold') errors.push('Diamond A is sold');
  if (memberB.status === 'sold') errors.push('Diamond B is sold');

  if (memberA.hasValidIndividualReservation) errors.push('Diamond A has an active individual reservation');
  if (memberB.hasValidIndividualReservation) errors.push('Diamond B has an active individual reservation');

  if (memberA.isLockedByAnotherActivePair) errors.push('Diamond A is locked by another active pair');
  if (memberB.isLockedByAnotherActivePair) errors.push('Diamond B is locked by another active pair');

  return errors;
}

// ── Draft pair creation ───────────────────────────────────────────────────────

/**
 * Validates that a pair can be created in draft state from two diamonds.
 * Less strict than publication (both don't need to be published/available),
 * but the physical eligibility and lock guards still apply.
 */
export function validatePairForCreation(
  diamondIdA: string,
  diamondIdB: string,
  memberA:    { isLockedByAnotherActivePair: boolean; status: DiamondStatus },
  memberB:    { isLockedByAnotherActivePair: boolean; status: DiamondStatus },
): string[] {
  const errors: string[] = [];

  if (!diamondIdA || !diamondIdB) errors.push('Both constituent diamonds are required');
  else if (diamondIdA === diamondIdB) errors.push('Constituent diamonds must be distinct');

  if (memberA.isLockedByAnotherActivePair) errors.push('Diamond A is locked by another active pair');
  if (memberB.isLockedByAnotherActivePair) errors.push('Diamond B is locked by another active pair');

  return errors;
}

// ── Slot configuration ────────────────────────────────────────────────────────

export interface SlotConfigInput {
  selection_mode:             SlotSelectionMode;
  price_mode:                 SlotPriceMode;
  compatible_shapes:          string[];
  allowed_diamond_categories: string[];
  min_carat:                  number | null;
  max_carat:                  number | null;
}

/**
 * Validates a single stone slot configuration.
 * Returns a list of violations (empty = valid).
 */
export function validateSlotConfig(slot: SlotConfigInput): string[] {
  const errors: string[] = [];

  if (slot.selection_mode === 'matched_pair') {
    if (!slot.compatible_shapes || slot.compatible_shapes.length === 0) {
      errors.push('matched_pair slot must specify at least one compatible shape');
    }
    if (!slot.allowed_diamond_categories || slot.allowed_diamond_categories.length === 0) {
      errors.push('matched_pair slot must specify at least one allowed diamond category');
    }
    if (slot.price_mode !== 'selected_inventory') {
      errors.push('matched_pair slot must use price_mode = selected_inventory');
    }
  }

  if (slot.selection_mode === 'fixed') {
    if (slot.price_mode !== 'included_in_setting') {
      errors.push('fixed slot must use price_mode = included_in_setting');
    }
  }

  if (slot.min_carat !== null && slot.max_carat !== null && slot.min_carat > slot.max_carat) {
    errors.push('Minimum carat cannot exceed maximum carat');
  }

  return errors;
}

// ── Cross-slot product validation ─────────────────────────────────────────────

export interface SlotIdentity {
  slot_key:      string;
  display_order: number;
}

/**
 * Cross-slot validation: no duplicate slot_key or display_order within the
 * same product.  Returns violations.
 */
export function validateSlotsForProduct(slots: SlotIdentity[]): string[] {
  const errors: string[] = [];
  const keys   = slots.map(s => s.slot_key);
  const orders = slots.map(s => s.display_order);

  const dupKeys = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  if (dupKeys.length > 0) errors.push(`Duplicate slot keys: ${dupKeys.join(', ')}`);

  const dupOrders = [...new Set(orders.filter((o, i) => orders.indexOf(o) !== i))];
  if (dupOrders.length > 0) errors.push(`Duplicate display orders: ${dupOrders.join(', ')}`);

  return errors;
}

// ── Pair-change and pair-delete guards (pure, based on lock state) ─────────────

import { isPairLockingDiamonds, type PairLockInput } from './eligibility';

/**
 * Returns true when constituent diamonds may be replaced.
 * Only allowed when the pair is NOT actively locking its diamonds —
 * i.e., it is in an unpublished draft state with no live reservation.
 */
export function canChangePairConstituents(pair: PairLockInput): boolean {
  return !isPairLockingDiamonds(pair);
}

/**
 * Returns true when the pair may be deleted.
 * Only unreserved draft pairs (status=available AND not locking) can be deleted.
 */
export function canDeletePair(pair: PairLockInput & { status: string }): boolean {
  if (pair.status === 'sold') return false;
  return !isPairLockingDiamonds(pair);
}
