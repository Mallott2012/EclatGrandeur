import type { RingMetal, ProductStatus, MediaType } from '@/lib/catalogue/enums'

export type { RingMetal, ProductStatus, MediaType }

// Necklace styles — free text in the DB; this list drives the form dropdown.
export const NECKLACE_STYLES = ['pendant', 'chain', 'collar', 'choker', 'station', 'lariat'] as const
export type NecklaceStyle = (typeof NECKLACE_STYLES)[number]

export const NECKLACE_STYLE_LABELS: Record<NecklaceStyle, string> = {
  pendant: 'Pendant', chain: 'Chain', collar: 'Collar',
  choker: 'Choker', station: 'Station', lariat: 'Lariat',
}

export interface NecklaceSettingRecord {
  id:                string
  name:              string
  slug:              string
  collection:        string | null
  style:             string | null
  metals:            RingMetal[]
  chain_lengths_cm:  number[]
  base_price_gbp:    string | null
  short_description: string | null
  description:       string | null
  status:            ProductStatus
  is_published:      boolean
  sort_order:        number
  created_by:        string | null
  updated_by:        string | null
  created_at:        string
  updated_at:        string
}

export interface NecklaceMediaRecord {
  id:                  string
  necklace_setting_id: string
  media_type:          MediaType
  storage_path:        string
  display_order:       number
  is_primary:          boolean
  alt_text:            string | null
  created_at:          string
}

export interface NecklaceSettingFull extends NecklaceSettingRecord {
  media: NecklaceMediaRecord[]
}
