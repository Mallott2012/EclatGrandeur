import type { DiamondCategory, ColourFamily, ColourIntensity } from '@/lib/diamonds/types';
import type { SlotSelectionMode } from '@/lib/pairs/types';

// ── Public-safe pair card (Part A result) ─────────────────────────────────────
// Does NOT include matching_notes, held_by_cart, approval fields, or DB internals.

export interface CompatiblePairCard {
  id:                 string;
  pair_sku:           string;
  shape:              string;
  total_carat:        number;
  carat_per_stone:    number | null;
  colour:             string | null;
  clarity:            string | null;
  colour_family:      ColourFamily | null;
  colour_intensity:   ColourIntensity | null;
  colour_description: string | null;
  pair_price_gbp:     number;
  diamond_category:   DiamondCategory;
}

// ── Configuration input (Part B / C / E) ─────────────────────────────────────

export interface EarringConfigurationInput {
  jewelleryProductId: string;
  metalVariantId?:    string;
  selectedPairs: Array<{
    slotKey: string;
    pairId:  string;
  }>;
}

// ── Validation result (Part B) ───────────────────────────────────────────────

export type ConfigurationErrorCode =
  | 'invalid_product'
  | 'invalid_slot'
  | 'missing_required_selection'
  | 'duplicate_pair_selection'
  | 'pair_not_compatible'
  | 'pair_unavailable'
  | 'invalid_metal'
  | 'configuration_invalid';

export interface ConfigurationError {
  code:     ConfigurationErrorCode;
  slotKey?: string;
  pairId?:  string;
  message:  string;
}

export interface ConfigurationValidationResult {
  valid:  boolean;
  errors: ConfigurationError[];
}

// ── Price result (Part C) ────────────────────────────────────────────────────

export interface EarringPairPriceItem {
  slotKey:   string;
  pairId:    string;
  pairPrice: number;
}

export interface EarringConfigurationPrice {
  jewelleryProductId: string;
  metalVariantId:     string | null;
  basePrice:          number;
  selectedPairs:      EarringPairPriceItem[];
  totalPrice:         number;
}

// ── Availability result (Part D) ─────────────────────────────────────────────

export interface SlotAvailability {
  slotKey:        string;
  label:          string;
  selection_mode: SlotSelectionMode;
  required:       boolean;
  pairCount:      number | null; // null for non-matched_pair slots
}

export interface EarringConfigurationAvailability {
  slots:                 SlotAvailability[];
  requiredSlotCount:     number;
  isCompletable:         boolean;
  validCombinationCount: number | null; // null when not calculable due to large inventory
}

// ── Preflight result (Part E) ────────────────────────────────────────────────

export interface ReservationPreflightResult {
  canClaim: boolean;
  issues:   string[];
}
