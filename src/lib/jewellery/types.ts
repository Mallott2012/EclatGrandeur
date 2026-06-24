// Jewellery product types — mirrors the jewellery_products schema.

import type { RingMetal } from '@/lib/diamonds/types'

// ── Enum types ────────────────────────────────────────────────────────────────

export type JewelleryCategory = 'earrings' | 'necklaces' | 'bracelets'

// ── Raw database row ──────────────────────────────────────────────────────────

export interface JewelleryProductRecord {
  id:             string
  slug:           string
  category:       JewelleryCategory
  name:           string
  subtitle:       string | null
  description:    string | null
  base_price_gbp: string          // NUMERIC comes as string
  metals:         RingMetal[]
  show_diamond:   boolean
  is_total_carat: boolean
  is_pair:        boolean
  is_published:   boolean
  sort_order:     number
  created_by:     string | null
  updated_by:     string | null
  created_at:     string
  updated_at:     string
}

export interface JewelleryProductMediaRecord {
  id:                   string
  jewellery_product_id: string
  media_type:           'image' | 'video_360' | 'video' | 'certificate_pdf'
  storage_path:         string
  display_order:        number
  alt_text:             string | null
  is_primary:           boolean
  metal:                string | null
  created_at:           string
}

// ── App-level type (parsed numerics) ─────────────────────────────────────────

export interface JewelleryProduct {
  id:             string
  slug:           string
  category:       JewelleryCategory
  name:           string
  subtitle:       string | null
  description:    string | null
  base_price_gbp: number
  metals:         RingMetal[]
  show_diamond:   boolean
  is_total_carat: boolean
  is_pair:        boolean
  is_published:   boolean
  sort_order:     number
  created_at:     string
  updated_at:     string
  media:          JewelleryProductMediaRecord[]
}

// ── Conversion helper ─────────────────────────────────────────────────────────

export function parseJewelleryProduct(
  r: JewelleryProductRecord,
  media: JewelleryProductMediaRecord[] = [],
): JewelleryProduct {
  return {
    ...r,
    base_price_gbp: parseFloat(r.base_price_gbp),
    media,
  }
}
