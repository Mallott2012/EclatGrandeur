/**
 * Earring-variant model types.
 *
 * Customers configure a finished earring set by choosing metal, total carat,
 * colour and clarity. Each genuinely sellable combination is one earring_variants
 * row. Customers never select individual diamonds, pairs, or stone slots.
 *
 * (The previous matched-pair types are removed — that model is deprecated; the
 *  0029–0033 schema remains dormant only for migration-history integrity.)
 */

export const EARRING_COLOURS   = ['D', 'E', 'F'] as const;
export const EARRING_CLARITIES = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'] as const;
export const EARRING_AVAILABILITY = ['available', 'reserved', 'sold', 'made_to_order', 'unavailable'] as const;

export type EarringColour       = typeof EARRING_COLOURS[number];
export type EarringClarity      = typeof EARRING_CLARITIES[number];
export type EarringAvailability = typeof EARRING_AVAILABILITY[number];

/** Customer-facing clarity wording. FL is shown as "Flawless". */
export const CLARITY_LABEL: Record<EarringClarity, string> = {
  VS2: 'VS2', VS1: 'VS1', VVS2: 'VVS2', VVS1: 'VVS1', IF: 'IF', FL: 'Flawless',
};

/** Only purchasable availability states are ever exposed to customers. */
export type PublicAvailability = 'available' | 'made_to_order';

/**
 * Customer-safe earring variant — the only shape returned by public APIs.
 * Never includes sku, admin_note, held_by_cart, held_until, or raw stock state.
 */
export interface PublicEarringVariant {
  id:           string;
  metal:        string;        // metal key, e.g. 'yellow-gold-18k'
  total_carat:  number;
  colour:       EarringColour;
  clarity:      EarringClarity;
  price_gbp:    number;
  currency:     string;
  availability: PublicAvailability;
}

/** Full admin view of a variant (staff-auth gated). */
export interface EarringVariantAdmin {
  id:                   string;
  jewellery_product_id: string;
  sku:                  string;
  metal:                string;
  total_carat:          number;
  colour:               EarringColour;
  clarity:              EarringClarity;
  price_gbp:            number;
  currency:             string;
  availability:         EarringAvailability;
  display_order:        number;
  is_published:         boolean;
  admin_note:           string | null;
  held_until:           string | null;
  held_by_cart:         string | null;
  created_at:           string;
  updated_at:           string;
}

export interface CreateEarringVariantInput {
  jewellery_product_id: string;
  metal:                string;
  total_carat:          number;
  colour:               EarringColour;
  clarity:              EarringClarity;
  price_gbp:            number;
  currency?:            string;
  availability?:        EarringAvailability;
  display_order?:       number;
  is_published?:        boolean;
  admin_note?:          string | null;
}

export interface UpdateEarringVariantInput {
  metal?:         string;
  total_carat?:   number;
  colour?:        EarringColour;
  clarity?:       EarringClarity;
  price_gbp?:     number;
  currency?:      string;
  availability?:  EarringAvailability;
  display_order?: number;
  is_published?:  boolean;
  admin_note?:    string | null;
}

/** Result of a variant reservation attempt. */
export interface VariantReservationResult {
  ok:                   boolean;
  reason?:              string;
  availability?:        PublicAvailability;
  reservationExpiresAt: string | null;  // null for made_to_order (no exclusive hold)
}
