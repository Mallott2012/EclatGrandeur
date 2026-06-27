/**
 * Earring Diamond Offer types — the ACTIVE customer-facing earring model.
 *
 * An offer is an editable completed matched-pair specification (admin-managed per
 * product). Not physical inventory: no GIA stones, no diamonds-table link, no holds.
 */

export const OFFER_COLOURS   = ['D', 'E', 'F'] as const;
export const OFFER_CLARITIES = ['VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'] as const;
export const OFFER_AVAILABILITY = ['available', 'made_to_order', 'unavailable'] as const;

export type OfferAvailability = typeof OFFER_AVAILABILITY[number];

/** Customer-facing clarity wording. FL → "Flawless". */
export const CLARITY_LABEL: Record<string, string> = {
  VS2: 'VS2', VS1: 'VS1', VVS2: 'VVS2', VVS1: 'VVS1', IF: 'IF', FL: 'Flawless',
};
export const clarityLabel = (c: string): string => CLARITY_LABEL[c] ?? c;

/**
 * Customer-safe offer — the only shape returned by public APIs.
 * Never includes sku, admin_note, internal status, or backend metadata.
 */
export interface PublicEarringOffer {
  id:               string;
  cut:              string;
  total_carat:      number;
  carat_per_stone:  number | null;
  colour:           string;
  clarity:          string;
  cut_grade:        string | null;
  polish:           string | null;
  symmetry:         string | null;
  fluorescence:     string | null;
  price_gbp:        number;
  currency:         string;
  availability:     'available' | 'made_to_order';
  supported_metals: string[];
}

export interface EarringOfferAdmin {
  id:                   string;
  jewellery_product_id: string;
  sku:                  string;
  supported_metals:     string[];
  cut:                  string;
  total_carat:          number;
  carat_per_stone:      number | null;
  colour:               string;
  clarity:              string;
  cut_grade:            string | null;
  polish:               string | null;
  symmetry:             string | null;
  fluorescence:         string | null;
  price_gbp:            number;
  currency:             string;
  availability:         OfferAvailability;
  is_published:         boolean;
  display_order:        number;
  admin_note:           string | null;
  created_at:           string;
  updated_at:           string;
}

export interface CreateEarringOfferInput {
  jewellery_product_id: string;
  supported_metals?:    string[];
  cut:                  string;
  total_carat:          number;
  carat_per_stone?:     number | null;
  colour:               string;
  clarity:              string;
  cut_grade?:           string | null;
  polish?:              string | null;
  symmetry?:            string | null;
  fluorescence?:        string | null;
  price_gbp:            number;
  currency?:            string;
  availability?:        OfferAvailability;
  is_published?:        boolean;
  display_order?:       number;
  admin_note?:          string | null;
}

export type UpdateEarringOfferInput = Partial<Omit<CreateEarringOfferInput, 'jewellery_product_id'>>;
