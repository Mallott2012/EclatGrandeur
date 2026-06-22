// Diamond and ring setting types — mirrors the new schema exactly.

// ── Enum types ────────────────────────────────────────────────────────────────

export type DiamondCut =
  | 'round' | 'princess' | 'cushion' | 'oval' | 'emerald'
  | 'pear'  | 'marquise' | 'radiant' | 'asscher' | 'heart'

export type DiamondColour = 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J'

export type DiamondClarity = 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2'

export type DiamondGrade = 'excellent' | 'very_good' | 'good' | 'fair' | 'poor'

export type DiamondFluorescence = 'none' | 'faint' | 'medium' | 'strong' | 'very_strong'

export type DiamondStatus = 'available' | 'sold'

export type MediaType = 'image' | 'video_360' | 'video' | 'certificate_pdf'

export type RingMetal =
  | 'platinum' | 'white_gold_18k' | 'yellow_gold_18k' | 'rose_gold_18k'
  | 'white_gold_9k' | 'yellow_gold_9k'

// ── Display helpers ───────────────────────────────────────────────────────────

export const CUT_LABELS: Record<DiamondCut, string> = {
  round:    'Round Brilliant',
  princess: 'Princess',
  cushion:  'Cushion',
  oval:     'Oval',
  emerald:  'Emerald',
  pear:     'Pear',
  marquise: 'Marquise',
  radiant:  'Radiant',
  asscher:  'Asscher',
  heart:    'Heart',
}

export const CLARITY_ORDER: DiamondClarity[] = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2']
export const COLOUR_ORDER: DiamondColour[]   = ['D', 'E', 'F', 'G', 'H', 'I', 'J']

export const GRADE_LABELS: Record<DiamondGrade, string> = {
  excellent: 'Excellent',
  very_good: 'Very Good',
  good:      'Good',
  fair:      'Fair',
  poor:      'Poor',
}

export const FLUORESCENCE_LABELS: Record<DiamondFluorescence, string> = {
  none:        'None',
  faint:       'Faint',
  medium:      'Medium',
  strong:      'Strong',
  very_strong: 'Very Strong',
}

export const METAL_LABELS: Record<RingMetal, string> = {
  platinum:        'Platinum',
  white_gold_18k:  '18ct White Gold',
  yellow_gold_18k: '18ct Yellow Gold',
  rose_gold_18k:   '18ct Rose Gold',
  white_gold_9k:   '9ct White Gold',
  yellow_gold_9k:  '9ct Yellow Gold',
}

// ── Raw database rows (numerics come as strings from Supabase) ────────────────

export interface DiamondRecord {
  id:                   string
  sku:                  string
  ring_setting_id:      string | null
  cut:                  DiamondCut
  carat:                string
  colour:               DiamondColour
  clarity:              DiamondClarity
  cut_grade:            DiamondGrade | null
  polish:               DiamondGrade | null
  symmetry:             DiamondGrade | null
  fluorescence:         DiamondFluorescence
  gia_report_number:    string | null
  gia_report_date:      string | null
  gia_report_url:       string | null
  measurement_length:   string | null
  measurement_width:    string | null
  measurement_depth:    string | null
  depth_pct:            string | null
  table_pct:            string | null
  price_gbp:            string
  status:               DiamondStatus
  is_published:         boolean
  notes:                string | null
  created_by:           string | null
  updated_by:           string | null
  created_at:           string
  updated_at:           string
}

export interface DiamondMediaRecord {
  id:            string
  diamond_id:    string
  media_type:    MediaType
  storage_path:  string
  display_order: number
  alt_text:      string | null
  is_primary:    boolean
  created_at:    string
}

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
  created_by:     string | null
  updated_by:     string | null
  created_at:     string
  updated_at:     string
}

export interface RingSettingMediaRecord {
  id:               string
  ring_setting_id:  string
  media_type:       MediaType
  storage_path:     string
  display_order:    number
  alt_text:         string | null
  is_primary:       boolean
  created_at:       string
}

// ── App-level types (parsed numerics) ─────────────────────────────────────────

export interface Diamond {
  id:                   string
  sku:                  string
  ring_setting_id:      string | null
  cut:                  DiamondCut
  carat:                number
  colour:               DiamondColour
  clarity:              DiamondClarity
  cut_grade:            DiamondGrade | null
  polish:               DiamondGrade | null
  symmetry:             DiamondGrade | null
  fluorescence:         DiamondFluorescence
  gia_report_number:    string | null
  gia_report_date:      string | null
  gia_report_url:       string | null
  measurement_length:   number | null
  measurement_width:    number | null
  measurement_depth:    number | null
  depth_pct:            number | null
  table_pct:            number | null
  price_gbp:            number
  status:               DiamondStatus
  is_published:         boolean
  notes:                string | null
  created_at:           string
  updated_at:           string
  media:                DiamondMediaRecord[]
}

export interface RingSetting {
  id:             string
  name:           string
  slug:           string
  collection:     string | null
  description:    string | null
  metals:         RingMetal[]
  base_price_gbp: number | null
  is_published:   boolean
  sort_order:     number
  created_at:     string
  updated_at:     string
  media:          RingSettingMediaRecord[]
  diamonds?:      Diamond[]
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function toNum(v: string | null): number | null {
  if (v === null) return null
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

export function parseDiamond(r: DiamondRecord, media: DiamondMediaRecord[] = []): Diamond {
  return {
    ...r,
    carat:              parseFloat(r.carat),
    price_gbp:          parseFloat(r.price_gbp),
    measurement_length: toNum(r.measurement_length),
    measurement_width:  toNum(r.measurement_width),
    measurement_depth:  toNum(r.measurement_depth),
    depth_pct:          toNum(r.depth_pct),
    table_pct:          toNum(r.table_pct),
    media,
  }
}

export function parseRingSetting(
  r: RingSettingRecord,
  media: RingSettingMediaRecord[] = [],
  diamonds: Diamond[] = [],
): RingSetting {
  return {
    ...r,
    base_price_gbp: toNum(r.base_price_gbp),
    media,
    diamonds,
  }
}
