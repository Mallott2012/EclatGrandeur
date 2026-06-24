import type {
  GemstoneType, GemShape, GemColour, GemClarity, GemGrade, GemFluorescence, ProductStatus,
} from '@/lib/catalogue/enums'

export type {
  GemstoneType, GemShape, GemColour, GemClarity, GemGrade, GemFluorescence, ProductStatus,
}

export interface EarringStoneRecord {
  id:                  string
  sku:                 string
  earring_setting_id: string | null
  stone_type:          GemstoneType
  shape:               GemShape | null
  carat:               string | null
  colour:              GemColour | null
  colour_description:  string | null
  clarity:             GemClarity | null
  clarity_description: string | null
  cut_grade:           GemGrade | null
  polish:              GemGrade | null
  symmetry:            GemGrade | null
  fluorescence:        GemFluorescence | null
  gia_report_number:   string | null
  gia_report_date:     string | null
  gia_report_url:      string | null
  price_gbp:           string | null
  status:              ProductStatus
  is_published:        boolean
  notes:               string | null
  created_by:          string | null
  updated_by:          string | null
  created_at:          string
  updated_at:          string
}

// A stone joined with its parent setting's name/slug (for list/detail display).
export interface EarringStoneWithSetting extends EarringStoneRecord {
  setting: { id: string; name: string; slug: string } | null
}
