import type { RingMetal, ProductStatus, MediaType } from '@/lib/catalogue/enums'

export type { RingMetal, ProductStatus, MediaType }

// Bracelet styles — free text in the DB; this list drives the form dropdown.
export const BRACELET_STYLES = ['tennis', 'bangle', 'cuff', 'charm', 'chain', 'link'] as const
export type BraceletStyle = (typeof BRACELET_STYLES)[number]

export const BRACELET_STYLE_LABELS: Record<BraceletStyle, string> = {
  tennis: 'Tennis', bangle: 'Bangle', cuff: 'Cuff',
  charm: 'Charm', chain: 'Chain', link: 'Link',
}

export interface BraceletSettingRecord {
  id:                string
  name:              string
  slug:              string
  collection:        string | null
  style:             string | null
  metals:            RingMetal[]
  sizes_cm:  number[]
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

export interface BraceletMediaRecord {
  id:                  string
  bracelet_setting_id: string
  media_type:          MediaType
  storage_path:        string
  display_order:       number
  is_primary:          boolean
  alt_text:            string | null
  created_at:          string
}

export interface BraceletSettingFull extends BraceletSettingRecord {
  media: BraceletMediaRecord[]
}
