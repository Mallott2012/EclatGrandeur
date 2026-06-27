// Jewellery product types — mirrors the jewellery_products schema.

import type { RingMetal } from '@/lib/diamonds/types'

// ── Enum types ────────────────────────────────────────────────────────────────

export type JewelleryCategory = 'earrings' | 'necklaces' | 'bracelets'

// ── Raw database row ──────────────────────────────────────────────────────────

export type EarringType =
  | 'classic_studs'
  | 'halo_studs'
  | 'drop_earrings'
  | 'pave_hoops'
  | 'fixed_composition'
  | 'other'

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
  gallery_config:  unknown | null
  metal_variants:  unknown | null
  earring_type:   EarringType | null
  created_by:      string | null
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
  gallery_config:  unknown | null
  metal_variants:  unknown | null
  earring_type:   EarringType | null
  created_at:      string
  updated_at:     string
  media:          JewelleryProductMediaRecord[]
}

// ── Conversion helper ─────────────────────────────────────────────────────────

// DB `ring_metal` enum uses '…_18ct' / '…_9ct'; the app uses '…_18k' / '…_9k'.
// Normalise stored values back to the app convention on read.
const METAL_FROM_DB: Record<string, string> = {
  white_gold_18ct: 'white_gold_18k', yellow_gold_18ct: 'yellow_gold_18k', rose_gold_18ct: 'rose_gold_18k',
  white_gold_9ct:  'white_gold_9k',  yellow_gold_9ct:  'yellow_gold_9k',  rose_gold_9ct:  'rose_gold_9k',
}

export function parseJewelleryProduct(
  r: JewelleryProductRecord,
  media: JewelleryProductMediaRecord[] = [],
): JewelleryProduct {
  return {
    ...r,
    base_price_gbp: parseFloat(r.base_price_gbp),
    metals:         (r.metals ?? []).map(m => (METAL_FROM_DB[m] ?? m) as RingMetal),
    gallery_config:  r.gallery_config  ?? null,
    metal_variants:  r.metal_variants  ?? null,
    earring_type:   r.earring_type ?? null,
    media,
  }
}
