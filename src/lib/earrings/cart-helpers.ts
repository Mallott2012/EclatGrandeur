// Pure helper functions for earring cart operations.
// No database calls, no server-only imports — safe for client and server contexts.

import type { ConfiguredEarring } from '@/types';
import type { CartItem } from '@/lib/store/cart';

// ── Pair description ──────────────────────────────────────────────────────────

/** Builds a customer-safe pair description from public pair attributes. */
export function buildPairDescription(pair: {
  shape:           string;
  totalCarat:      number;
  caratPerStone:   number | null;
  colour:          string | null;
  clarity:         string | null;
  colourDescription: string | null;
}): string {
  const carat = pair.caratPerStone
    ? `${pair.caratPerStone.toFixed(2)}ct × 2`
    : `${pair.totalCarat.toFixed(2)}ct total`;

  const parts: string[] = [
    carat,
    pair.shape.charAt(0).toUpperCase() + pair.shape.slice(1),
  ];

  if (pair.colourDescription) {
    parts.push(pair.colourDescription);
  } else if (pair.colour) {
    parts.push(pair.colour);
  }

  if (pair.clarity) parts.push(pair.clarity);

  return parts.join(' · ');
}

// ── Price conversion ──────────────────────────────────────────────────────────

/** Converts GBP (£) to pence (minor units). */
export function toPence(gbp: number): number {
  return Math.round(gbp * 100);
}

// ── Cart ID ───────────────────────────────────────────────────────────────────

/**
 * Builds a deterministic cart line ID from productId + sorted pair IDs.
 * Ensures the same configuration always maps to the same cart line ID,
 * enabling duplicate detection.
 */
export function buildEarringCartLineId(productId: string, pairIds: string[]): string {
  return `earring-${productId}-${[...pairIds].sort().join('-')}`;
}

// ── Pair extraction ───────────────────────────────────────────────────────────

/** Returns all pair IDs held by a configured earring. */
export function getPairIdsFromEarringConfig(config: ConfiguredEarring): string[] {
  return config.selectedSlots.map(s => s.pairId);
}

// ── Duplicate detection ───────────────────────────────────────────────────────

/**
 * Returns true when any of the new pair IDs is already used in a cart item.
 * Covers both: same configuration (exact match) and partial overlap (one
 * pair assigned to two different cart lines).
 */
export function wouldDuplicatePairInCart(
  cartItems:   CartItem[],
  newPairIds:  string[],
): boolean {
  const existingPairIds = new Set(
    cartItems
      .filter(i => i.earringConfig)
      .flatMap(i => getPairIdsFromEarringConfig(i.earringConfig!)),
  );
  return newPairIds.some(id => existingPairIds.has(id));
}

// ── Reservation expiry ────────────────────────────────────────────────────────

/** Returns true when the earring reservation has expired. */
export function isEarringCartLineExpired(config: ConfiguredEarring): boolean {
  return new Date(config.reservationExpiresAt) <= new Date();
}
