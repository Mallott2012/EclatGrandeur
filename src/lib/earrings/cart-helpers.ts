// Pure helper functions for earring (offer) cart operations.
// No database calls, no server-only imports — safe for client and server contexts.

import type { ConfiguredEarring } from '@/types';
import type { CartItem } from '@/lib/store/cart';
import { clarityLabel } from './offer-types';

/** Converts GBP (£) to pence (minor units). */
export function toPence(gbp: number): number {
  return Math.round(gbp * 100);
}

export { clarityLabel };

/** Capitalises a diamond cut/shape for display. */
export function cutLabel(cut: string): string {
  const s = cut.toLowerCase();
  if (s === 'round') return 'Round Brilliant';
  return cut.charAt(0).toUpperCase() + cut.slice(1);
}

/** Customer-safe one-line description of a configured earring offer. */
export function buildOfferDescription(c: Pick<ConfiguredEarring, 'totalCarat' | 'cut' | 'colour' | 'clarity'>): string {
  return `${c.totalCarat.toFixed(2)}ct total · ${cutLabel(c.cut)} · ${c.colour} · ${clarityLabel(c.clarity)}`;
}

/** Deterministic cart line ID from productId + offerId (enables dedup). */
export function buildEarringCartLineId(productId: string, offerId: string): string {
  return `earring-${productId}-${offerId}`;
}

/** Returns the offer ID held by a configured earring. */
export function getOfferIdFromEarringConfig(config: ConfiguredEarring): string {
  return config.offerId;
}

/** True when the offer is already present in a cart line. */
export function wouldDuplicateOfferInCart(cartItems: CartItem[], offerId: string): boolean {
  return cartItems.some(i => i.earringConfig?.offerId === offerId);
}
