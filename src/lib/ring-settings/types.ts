export type RingMetal =
  | 'platinum'
  | 'white_gold_18k'
  | 'yellow_gold_18k'
  | 'rose_gold_18k'
  | 'white_gold_9k'
  | 'yellow_gold_9k'

export type MediaType =
  | 'image'
  | 'video_360'
  | 'video'
  | 'certificate_pdf'

export const METAL_LABELS: Record<RingMetal, string> = {
  platinum:        'Platinum',
  white_gold_18k:  '18k White Gold',
  yellow_gold_18k: '18k Yellow Gold',
  rose_gold_18k:   '18k Rose Gold',
  white_gold_9k:   '9k White Gold',
  yellow_gold_9k:  '9k Yellow Gold',
}

export const ALL_METALS: RingMetal[] = [
  'platinum',
  'white_gold_18k',
  'yellow_gold_18k',
  'rose_gold_18k',
  'white_gold_9k',
  'yellow_gold_9k',
]

export interface RingSettingRecord {
  id:             string
  name:           string
  slug:           string
  collection:     string | null
  description:    string | null
  metals:         RingMetal[]
  base_price_gbp: string | null
  is_published:   boolean
  sort_order:     number
  gallery_config:  unknown | null
  metal_variants:  unknown | null
  created_by:      string | null
  updated_by:     string | null
  created_at:     string
  updated_at:     string
}

export interface RingSettingMediaRecord {
  id:              string
  ring_setting_id: string
  media_type:      MediaType
  storage_path:    string
  display_order:   number
  alt_text:        string | null
  is_primary:      boolean
  metal:           string | null
  created_at:      string
}

export interface RingSettingFull extends RingSettingRecord {
  media: RingSettingMediaRecord[]
}
