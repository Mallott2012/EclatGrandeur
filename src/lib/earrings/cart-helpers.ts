// Pure helper functions for earring (variant) cart operations.
// No database calls, no server-only imports — safe for client and server contexts.

import type { ConfiguredEarring } from '@/types';
import type { CartItem } from '@/lib/store/cart';
import { CLARITY_LABEL, type EarringClarity } from './types';

// ── Price conversion ──────────────────────────────────────────────────────────

/** Converts GBP (£) to pence (minor units). */
export function toPence(gbp: number): number {
  return Math.round(gbp * 100);
}

// ── Labels ────────────────────────────────────────────────────────────────────

/** Customer-facing clarity wording ("Flawless" for FL). Safe for unknown values. */
export function clarityLabel(clarity: string): string {
  return CLARITY_LABEL[clarity as EarringClarity] ?? clarity;
}

/** Customer-safe one-line description of a configured earring set. */
export function buildVariantDescription(v: {
  totalCarat: number; colour: string; clarity: string;
}): string {
  return `${v.totalCarat.toFixed(2)}ct total · ${v.colour} · ${clarityLabel(v.clarity)}`;
}

// ── Cart ID ───────────────────────────────────────────────────────────────────

/** Deterministic cart line ID from productId + variantId (enables dedup). */
export function buildEarringCartLineId(productId: string, variantId: string): string {
  return `earring-${productId}-${variantId}`;
}

// ── Variant extraction ────────────────────────────────────────────────────────

/** Returns the variant ID held by a configured earring. */
export function getVariantIdFromEarringConfig(config: ConfiguredEarring): string {
  return config.variantId;
}

// ── Duplicate detection ───────────────────────────────────────────────────────

/** True when the variant is already present in a cart line. */
export function wouldDuplicateVariantInCart(cartItems: CartItem[], variantId: string): boolean {
  return cartItems.some(i => i.earringConfig?.variantId === variantId);
}

// ── Reservation expiry ────────────────────────────────────────────────────────

/**
 * True when an earring reservation has expired.
 * Made-to-order variants carry no exclusive hold (reservationExpiresAt === null)
 * and therefore never expire.
 */
export function isEarringCartLineExpired(config: ConfiguredEarring): boolean {
  if (!config.reservationExpiresAt) return false;
  return new Date(config.reservationExpiresAt) <= new Date();
}
