import { isEclatEligible, type EligibilityInput } from '@/lib/diamonds/eligibility';
import type { DiamondCategory, ColourFamily, DiamondStatus } from '@/lib/diamonds/types';

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
