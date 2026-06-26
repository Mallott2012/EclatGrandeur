import { isEclatEligible, type EligibilityInput } from '@/lib/diamonds/eligibility';
import type { DiamondCategory, ColourFamily, DiamondStatus } from '@/lib/diamonds/types';
import type { PairStatus } from './types';

// ── Central pair-lock definition ──────────────────────────────────────────────

export interface PairLockInput {
  status:       PairStatus;
  is_published: boolean;
  held_until:   string | null;
}

/**
 * Single source of truth for whether a pair currently locks its constituent
 * diamonds against individual use (ring selection, individual reservation, etc.).
 *
 * A pair locks when ANY of these three conditions is true:
 *   1. status = 'sold'                              → permanent lock
 *   2. is_published = true AND status = 'available' → live in catalogue
 *   3. status = 'reserved' AND held_until > now     → unexpired reservation
 *                                                     (regardless of is_published)
 *
 * A pair does NOT lock when:
 *   - status = 'reserved' AND held_until ≤ now  (expired hold)
 *   - is_published = false AND no valid reservation
 *
 * `now` is injectable so tests can control the reference time.
 * This logic is mirrored exactly in the PostgreSQL functions (0032) and in
 * getActivePairDiamondIds() and claimDiamond() database queries.
 */
export function isPairLockingDiamonds(
  pair: PairLockInput,
  now: Date = new Date(),
): boolean {
  if (pair.status === 'sold') return true;
  if (pair.is_published && pair.status === 'available') return true;
  if (pair.status === 'reserved' && pair.held_until !== null) {
    return pair.held_until > now.toISOString();
  }
  return false;
}

// ── Input types ───────────────────────────────────────────────────────────────

export interface PairMemberInput extends EligibilityInput {
  status:           DiamondStatus;
  is_published:     boolean;
  diamond_category: DiamondCategory;
  colour_family:    ColourFamily | null;
}

export interface PairEligibilityInput {
  diamond_a:        PairMemberInput;
  diamond_b:        PairMemberInput;
  shape:            string;
  diamond_category: DiamondCategory;
  colour_family:    ColourFamily | null;
}

// ── Pure eligibility rules ────────────────────────────────────────────────────

/**
 * A pair may only be published when both constituent diamonds individually
 * pass the universal Éclat quality standard.
 * Pure function — testable without database access.
 */
export function isPairEligible(input: PairEligibilityInput): boolean {
  return isEclatEligible(input.diamond_a) && isEclatEligible(input.diamond_b);
}

/**
 * A pair is only selectable when both constituent diamonds are published
 * and individually available (not reserved, sold, or unpublished).
 *
 * If either member is reserved or sold — by any cart, not just the current one —
 * the pair is considered unavailable and must not be offered for selection.
 *
 * Pure function — testable without database access.
 */
export function arePairMembersAvailable(input: PairEligibilityInput): boolean {
  const aOk = input.diamond_a.is_published && input.diamond_a.status === 'available';
  const bOk = input.diamond_b.is_published && input.diamond_b.status === 'available';
  return aOk && bOk;
}
