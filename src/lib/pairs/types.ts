import type { DiamondCategory, ColourFamily, ColourIntensity } from '@/lib/diamonds/types';

// ── Status ────────────────────────────────────────────────────────────────────

export type PairStatus = 'available' | 'reserved' | 'sold';

// ── Stone-slot enums ──────────────────────────────────────────────────────────

export type StoneSlotRole =
  | 'centre_pair'
  | 'top_pair'
  | 'drop_pair'
  | 'accent_pair'
  | 'centre_single'
  | 'fixed_accent';

export type SlotSelectionMode = 'matched_pair' | 'single' | 'fixed';
export type SlotPriceMode     = 'selected_inventory' | 'included_in_setting';

// ── DiamondPair — raw DB row (numerics arrive as strings from Supabase) ───────

export interface DiamondPairRecord {
  id:                 string;
  pair_sku:           string;
  diamond_id_a:       string;
  diamond_id_b:       string;
  shape:              string;
  diamond_category:   DiamondCategory;
  colour_family:      ColourFamily | null;
  colour:             string | null;
  clarity:            string | null;
  colour_intensity:   ColourIntensity | null;
  colour_description: string | null;
  total_carat:        string;        // numeric → string from Supabase
  carat_per_stone:    string | null;
  pair_price_gbp:     string;
  status:             PairStatus;
  is_published:       boolean;
  held_until:         string | null;
  held_by_cart:       string | null;
  matching_notes:     string | null; // never returned in public API responses
  created_at:         string;
  updated_at:         string;
}

// ── DiamondPair — app-level (parsed numerics) ─────────────────────────────────

export interface DiamondPair {
  id:                 string;
  pair_sku:           string;
  diamond_id_a:       string;
  diamond_id_b:       string;
  shape:              string;
  diamond_category:   DiamondCategory;
  colour_family:      ColourFamily | null;
  colour:             string | null;
  clarity:            string | null;
  colour_intensity:   ColourIntensity | null;
  colour_description: string | null;
  total_carat:        number;
  carat_per_stone:    number | null;
  pair_price_gbp:     number;
  status:             PairStatus;
  is_published:       boolean;
  held_until:         string | null;
  held_by_cart:       string | null;
  created_at:         string;
  updated_at:         string;
  // matching_notes intentionally omitted — internal field
}

export function parseDiamondPair(r: DiamondPairRecord): DiamondPair {
  return {
    id:                 r.id,
    pair_sku:           r.pair_sku,
    diamond_id_a:       r.diamond_id_a,
    diamond_id_b:       r.diamond_id_b,
    shape:              r.shape,
    diamond_category:   r.diamond_category,
    colour_family:      r.colour_family,
    colour:             r.colour,
    clarity:            r.clarity,
    colour_intensity:   r.colour_intensity,
    colour_description: r.colour_description,
    total_carat:        parseFloat(r.total_carat),
    carat_per_stone:    r.carat_per_stone != null ? parseFloat(r.carat_per_stone) : null,
    pair_price_gbp:     parseFloat(r.pair_price_gbp),
    status:             r.status,
    is_published:       r.is_published,
    held_until:         r.held_until,
    held_by_cart:       r.held_by_cart,
    created_at:         r.created_at,
    updated_at:         r.updated_at,
  };
}

// ── JewelleryStoneSlot — raw DB row ───────────────────────────────────────────

export interface JewelleryStoneSlotRecord {
  id:                         string;
  jewellery_product_id:       string;
  slot_key:                   string;
  label:                      string;
  display_order:              number;
  role:                       StoneSlotRole;
  selection_mode:             SlotSelectionMode;
  required:                   boolean;
  quantity:                   number;
  compatible_shapes:          string[];
  min_carat:                  string | null;
  max_carat:                  string | null;
  allowed_diamond_categories: DiamondCategory[];
  allowed_colour_families:    ColourFamily[] | null;
  price_mode:                 SlotPriceMode;
  fixed_stone_description:    string | null;
  created_at:                 string;
  updated_at:                 string;
}

// ── JewelleryStoneSlot — app-level ────────────────────────────────────────────

export interface JewelleryStoneSlot {
  id:                         string;
  jewellery_product_id:       string;
  slot_key:                   string;
  label:                      string;
  display_order:              number;
  role:                       StoneSlotRole;
  selection_mode:             SlotSelectionMode;
  required:                   boolean;
  quantity:                   number;
  compatible_shapes:          string[];
  min_carat:                  number | null;
  max_carat:                  number | null;
  allowed_diamond_categories: DiamondCategory[];
  allowed_colour_families:    ColourFamily[] | null;
  price_mode:                 SlotPriceMode;
  fixed_stone_description:    string | null;
  created_at:                 string;
  updated_at:                 string;
}

export function parseJewelleryStoneSlot(r: JewelleryStoneSlotRecord): JewelleryStoneSlot {
  return {
    ...r,
    min_carat: r.min_carat != null ? parseFloat(r.min_carat) : null,
    max_carat: r.max_carat != null ? parseFloat(r.max_carat) : null,
  };
}

// ── SlotConstraints — minimal shape for compatibility checks (testable without DB) ──

export interface SlotConstraints {
  compatible_shapes:          string[];
  min_carat:                  number | null;
  max_carat:                  number | null;
  allowed_diamond_categories: DiamondCategory[];
  allowed_colour_families:    ColourFamily[] | null;
  selection_mode:             SlotSelectionMode;
}

// ── Admin input types ─────────────────────────────────────────────────────────

export interface CreatePairInput {
  diamond_id_a:       string;
  diamond_id_b:       string;
  shape:              string;
  diamond_category:   DiamondCategory;
  colour_family?:     ColourFamily | null;
  colour?:            string | null;
  clarity?:           string | null;
  colour_intensity?:  ColourIntensity | null;
  colour_description?: string | null;
  total_carat:        number;
  carat_per_stone?:   number | null;
  pair_price_gbp:     number;
  matching_notes?:    string | null;
  pair_sku?:          string;           // omit to auto-generate
}

// ── Update input type ─────────────────────────────────────────────────────────

export interface UpdatePairInput {
  pair_sku?:          string;
  pair_price_gbp?:    number;
  total_carat?:       number;
  carat_per_stone?:   number | null;
  colour?:            string | null;
  clarity?:           string | null;
  colour_intensity?:  ColourIntensity | null;
  colour_description?: string | null;
  matching_notes?:    string | null;
  // is_published is not here — use publishPair() / unpublishPair() instead
}

// ── Admin view type (includes matching_notes + constituent summaries) ──────────

export interface DiamondSummary {
  id:           string;
  sku:          string;
  cut:          string;
  carat:        number;
  colour:       string | null;
  clarity:      string | null;
  status:       PairStatus;
  is_published: boolean;
}

/**
 * Admin-only view of a diamond pair.
 * Includes matching_notes (intentionally excluded from public DiamondPair).
 * Optionally includes constituent diamond summaries from a join.
 */
export interface DiamondPairAdmin {
  id:                 string;
  pair_sku:           string;
  diamond_id_a:       string;
  diamond_id_b:       string;
  shape:              string;
  diamond_category:   DiamondCategory;
  colour_family:      ColourFamily | null;
  colour:             string | null;
  clarity:            string | null;
  colour_intensity:   ColourIntensity | null;
  colour_description: string | null;
  total_carat:        number;
  carat_per_stone:    number | null;
  pair_price_gbp:     number;
  status:             PairStatus;
  is_published:       boolean;
  held_until:         string | null;
  matching_notes:     string | null;
  created_at:         string;
  updated_at:         string;
  diamond_a?:         DiamondSummary;
  diamond_b?:         DiamondSummary;
}

export interface UpdateSlotInput {
  slot_key?:                  string;
  label?:                     string;
  display_order?:             number;
  role?:                      StoneSlotRole;
  selection_mode?:            SlotSelectionMode;
  required?:                  boolean;
  quantity?:                  number;
  compatible_shapes?:         string[];
  min_carat?:                 number | null;
  max_carat?:                 number | null;
  allowed_diamond_categories?: DiamondCategory[];
  allowed_colour_families?:   ColourFamily[] | null;
  price_mode?:                SlotPriceMode;
  fixed_stone_description?:   string | null;
}

export interface CreateSlotInput {
  jewellery_product_id:       string;
  slot_key:                   string;
  label:                      string;
  display_order?:             number;
  role:                       StoneSlotRole;
  selection_mode:             SlotSelectionMode;
  required?:                  boolean;
  quantity?:                  number;
  compatible_shapes?:         string[];
  min_carat?:                 number | null;
  max_carat?:                 number | null;
  allowed_diamond_categories?: DiamondCategory[];
  allowed_colour_families?:   ColourFamily[] | null;
  price_mode?:                SlotPriceMode;
  fixed_stone_description?:   string | null;
}
