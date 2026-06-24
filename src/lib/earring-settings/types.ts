import type { RingMetal, ProductStatus, MediaType } from '@/lib/catalogue/enums'

export type { RingMetal, ProductStatus, MediaType }

// Earring styles — free text in the DB; this list drives the form dropdown.
export const EARRING_STYLES = ['stud', 'drop', 'hoop', 'huggie', 'chandelier', 'ear_cuff', 'cluster'] as const
export type EarringStyle = (typeof EARRING_STYLES)[number]

export const EARRING_STYLE_LABELS: Record<EarringStyle, string> = {
  stud: 'Stud', drop: 'Drop', hoop: 'Hoop', huggie: 'Huggie',
  chandelier: 'Chandelier', ear_cuff: 'Ear Cuff', cluster: 'Cluster',
}

export interface EarringSettingRecord {
  id:                string
  name:              string
  slug:              string
  collection:        string | null
  style:             string | null
  metals:            RingMetal[]
  is_pair:           boolean
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

export interface EarringMediaRecord {
  id:                  string
  earring_setting_id: string
  media_type:          MediaType
  storage_path:        string
  display_order:       number
  is_primary:          boolean
  alt_text:            string | null
  created_at:          string
}

export interface EarringSettingFull extends EarringSettingRecord {
  media: EarringMediaRecord[]
}
