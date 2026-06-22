// Diamond inventory DTOs and DTO conversion functions.
// DiamondRecord mirrors public.diamonds exactly (including cert_pdf_path) and is
// used only within server-only repository and service modules.
// DiamondFull and DiamondSalesView are the two public-facing shapes:
//   - DiamondFull: for super_admin and diamond_buyer — all fields except cert_pdf_path
//   - DiamondSalesView: for sales_adviser — no supplier identity, no costs, no cert path,
//     no internal_notes; hold_reason nulled when the hold belongs to another user

import type { StaffUser } from '@/lib/staff-shared'

// ── Enum types (mirror public.* PostgreSQL enums) ─────────────────────────────

export type DiamondOrigin         = 'natural' | 'lab_grown'
export type DiamondColourCategory = 'standard' | 'fancy'
export type DiamondColourGrade    = 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
export type FancyColourIntensity  =
  | 'Faint' | 'Very Light' | 'Light'
  | 'Fancy Light' | 'Fancy' | 'Fancy Intense'
  | 'Fancy Vivid' | 'Fancy Deep' | 'Fancy Dark'
export type DiamondShape =
  | 'round' | 'oval' | 'princess' | 'emerald' | 'cushion'
  | 'pear'  | 'marquise' | 'radiant' | 'asscher' | 'heart'
  | 'trilliant' | 'baguette' | 'old_european' | 'old_mine'
export type DiamondClarity      = 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2'
export type DiamondCut          = 'Ideal' | 'Excellent' | 'Very Good' | 'Good' | 'Fair'
export type DiamondFinish       = 'Excellent' | 'Very Good' | 'Good' | 'Fair'
export type DiamondFluorescence = 'None' | 'Faint' | 'Medium' | 'Strong' | 'Very Strong'
export type CertificateLab      = 'GIA' | 'IGI' | 'HRD' | 'AGS' | 'GCAL'
export type DiamondStatus       = 'available' | 'on_hold' | 'reserved' | 'sold' | 'removed'
export type DiamondMediaType    = 'image' | 'video_360'

// Seeded values from fancy_colour_hues. Adding a new hue requires an INSERT
// migration AND adding the value here.
export const FANCY_HUES = [
  'yellow', 'pink', 'blue', 'green', 'brown',
  'grey', 'black', 'orange', 'red', 'violet',
] as const
export type FancyColourHue = (typeof FANCY_HUES)[number]

// ── Raw database row ──────────────────────────────────────────────────────────
// Supabase returns numeric columns (carat, meas_*, table_pct, depth_pct) as strings.
// cert_pdf_path is present here for internal use by certificates.ts only and must
// never appear in DiamondFull or DiamondSalesView.
export interface DiamondRecord {
  id:                       string
  sku:                      string
  supplier_id:              string | null
  supplier_sku:             string | null
  origin:                   DiamondOrigin
  colour_category:          DiamondColourCategory
  colour_grade:             DiamondColourGrade | null
  fancy_colour_hue:         FancyColourHue | null
  fancy_colour_intensity:   FancyColourIntensity | null
  fancy_colour_overtone:    string | null
  shape:                    DiamondShape
  carat:                    string            // numeric(8,3) → string from Supabase
  clarity:                  DiamondClarity
  cut:                      DiamondCut | null
  polish:                   DiamondFinish
  symmetry:                 DiamondFinish
  fluorescence:             DiamondFluorescence
  meas_length_mm:           string | null
  meas_width_mm:            string | null
  meas_depth_mm:            string | null
  table_pct:                string | null
  depth_pct:                string | null
  girdle:                   string | null
  culet:                    string | null
  cert_lab:                 CertificateLab | null
  cert_number:              string | null
  cert_pdf_path:            string | null     // INTERNAL ONLY — never expose
  retail_price_amount:      number | null
  retail_price_currency:    string
  supplier_cost_amount:     number | null
  supplier_cost_currency:   string
  status:                   DiamondStatus
  is_visible:               boolean
  held_by_user_id:          string | null
  held_at:                  string | null
  hold_expires_at:          string | null
  hold_reason:              string | null
  selection_note:           string | null
  internal_notes:           string | null
  last_availability_check:  string | null
  created_at:               string
  updated_at:               string
  created_by:               string | null
  updated_by:               string | null
}

// ── Paginated result ──────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[]
  page:  number
  limit: number
  total: number
}

// ── DiamondFull ───────────────────────────────────────────────────────────────
// For super_admin and diamond_buyer. Numeric columns converted from string to number.
// cert_pdf_path is absent — use getCertificateSignedUrl() from certificates.ts.
export interface DiamondFull {
  id:                       string
  sku:                      string
  supplier_id:              string | null
  supplier_sku:             string | null
  origin:                   DiamondOrigin
  colour_category:          DiamondColourCategory
  colour_grade:             DiamondColourGrade | null
  fancy_colour_hue:         FancyColourHue | null
  fancy_colour_intensity:   FancyColourIntensity | null
  fancy_colour_overtone:    string | null
  shape:                    DiamondShape
  carat:                    number
  clarity:                  DiamondClarity
  cut:                      DiamondCut | null
  polish:                   DiamondFinish
  symmetry:                 DiamondFinish
  fluorescence:             DiamondFluorescence
  meas_length_mm:           number | null
  meas_width_mm:            number | null
  meas_depth_mm:            number | null
  table_pct:                number | null
  depth_pct:                number | null
  girdle:                   string | null
  culet:                    string | null
  cert_lab:                 CertificateLab | null
  cert_number:              string | null
  // cert_pdf_path intentionally absent
  supplier_code:            string | null   // from suppliers join; null when not joined
  retail_price_amount:      number | null
  retail_price_currency:    string
  supplier_cost_amount:     number | null
  supplier_cost_currency:   string
  status:                   DiamondStatus
  is_visible:               boolean
  held_by_user_id:          string | null
  held_at:                  string | null
  hold_expires_at:          string | null
  hold_reason:              string | null
  selection_note:           string | null
  internal_notes:           string | null
  last_availability_check:  string | null
  created_at:               string
  updated_at:               string
  created_by:               string | null
  updated_by:               string | null
  holdIsExpired:            boolean           // derived
}

// ── DiamondSalesView ──────────────────────────────────────────────────────────
// For sales_adviser. Omits: supplier_id, supplier_sku, supplier costs, cert_pdf_path,
// internal_notes, held_by_user_id.
// hold_reason is null when isMyHold is false (another adviser's hold).
export interface DiamondSalesView {
  id:                       string
  sku:                      string
  origin:                   DiamondOrigin
  colour_category:          DiamondColourCategory
  colour_grade:             DiamondColourGrade | null
  fancy_colour_hue:         FancyColourHue | null
  fancy_colour_intensity:   FancyColourIntensity | null
  fancy_colour_overtone:    string | null
  shape:                    DiamondShape
  carat:                    number
  clarity:                  DiamondClarity
  cut:                      DiamondCut | null
  polish:                   DiamondFinish
  symmetry:                 DiamondFinish
  fluorescence:             DiamondFluorescence
  meas_length_mm:           number | null
  meas_width_mm:            number | null
  meas_depth_mm:            number | null
  table_pct:                number | null
  depth_pct:                number | null
  girdle:                   string | null
  culet:                    string | null
  cert_lab:                 CertificateLab | null
  cert_number:              string | null
  retail_price_amount:      number | null
  retail_price_currency:    string
  status:                   DiamondStatus
  is_visible:               boolean
  isMyHold:                 boolean
  held_at:                  string | null
  hold_expires_at:          string | null
  hold_reason:              string | null   // null when !isMyHold
  selection_note:           string | null
  last_availability_check:  string | null
  created_at:               string
  updated_at:               string
  created_by:               string | null
  updated_by:               string | null
  holdIsExpired:            boolean
}

// ── Media types ───────────────────────────────────────────────────────────────
// DiamondMediaRecord mirrors public.diamond_media. storage_path is INTERNAL ONLY.
export interface DiamondMediaRecord {
  id:            string
  diamond_id:    string
  media_type:    DiamondMediaType
  storage_path:  string           // INTERNAL ONLY — excluded from DiamondMediaResponse
  display_order: number
  alt_text:      string | null
  is_primary:    boolean
  created_at:    string
}

// Returned to callers — storage_path replaced by a time-limited signed URL.
export interface DiamondMediaResponse {
  id:            string
  diamond_id:    string
  media_type:    DiamondMediaType
  signed_url:    string
  display_order: number
  alt_text:      string | null
  is_primary:    boolean
  created_at:    string
}

// ── Certificate result ────────────────────────────────────────────────────────
export interface CertSignedUrlResult {
  signed_url:    string
  expires_at:    string    // ISO 8601 datetime
  auditWarning?: boolean   // true when the audit event could not be written (upload only)
}

// ── RPC result types ──────────────────────────────────────────────────────────
export interface TransitionResult {
  id:             string
  oldStatus:      DiamondStatus
  newStatus:      DiamondStatus
  wasExpiredHold: boolean
}

export interface ExtendResult {
  id:                 string
  previousExpiresAt:  string
  newExpiresAt:       string
  originalHeldAt:     string
}

// ── DiamondListRecord ─────────────────────────────────────────────────────────
// DiamondRecord extended with the supplier code from a left join on suppliers.
// Returned by findManyDiamonds (list queries); absent from single-record lookups.
export type DiamondListRecord = DiamondRecord & { supplier_code: string | null }

// ── DTO conversion helpers ────────────────────────────────────────────────────

function toNum(value: string | null): number | null {
  if (value === null) return null
  const n = parseFloat(value)
  return isNaN(n) ? null : n
}

function isHoldExpired(record: DiamondRecord): boolean {
  return (
    record.status === 'on_hold' &&
    record.hold_expires_at !== null &&
    new Date(record.hold_expires_at) <= new Date()
  )
}

// Accepts both DiamondRecord (single-lookup, no join) and DiamondListRecord
// (list queries with supplier join). supplier_code is null when not joined.
export function toDiamondFull(record: DiamondRecord & { supplier_code?: string | null }): DiamondFull {
  return {
    id:                      record.id,
    sku:                     record.sku,
    supplier_id:             record.supplier_id,
    supplier_sku:            record.supplier_sku,
    origin:                  record.origin,
    colour_category:         record.colour_category,
    colour_grade:            record.colour_grade,
    fancy_colour_hue:        record.fancy_colour_hue,
    fancy_colour_intensity:  record.fancy_colour_intensity,
    fancy_colour_overtone:   record.fancy_colour_overtone,
    shape:                   record.shape,
    carat:                   parseFloat(record.carat),
    clarity:                 record.clarity,
    cut:                     record.cut,
    polish:                  record.polish,
    symmetry:                record.symmetry,
    fluorescence:            record.fluorescence,
    meas_length_mm:          toNum(record.meas_length_mm),
    meas_width_mm:           toNum(record.meas_width_mm),
    meas_depth_mm:           toNum(record.meas_depth_mm),
    table_pct:               toNum(record.table_pct),
    depth_pct:               toNum(record.depth_pct),
    girdle:                  record.girdle,
    culet:                   record.culet,
    cert_lab:                record.cert_lab,
    cert_number:             record.cert_number,
    supplier_code:           record.supplier_code ?? null,
    retail_price_amount:     record.retail_price_amount,
    retail_price_currency:   record.retail_price_currency,
    supplier_cost_amount:    record.supplier_cost_amount,
    supplier_cost_currency:  record.supplier_cost_currency,
    status:                  record.status,
    is_visible:              record.is_visible,
    held_by_user_id:         record.held_by_user_id,
    held_at:                 record.held_at,
    hold_expires_at:         record.hold_expires_at,
    hold_reason:             record.hold_reason,
    selection_note:          record.selection_note,
    internal_notes:          record.internal_notes,
    last_availability_check: record.last_availability_check,
    created_at:              record.created_at,
    updated_at:              record.updated_at,
    created_by:              record.created_by,
    updated_by:              record.updated_by,
    holdIsExpired:           isHoldExpired(record),
  }
}

export function toDiamondSalesView(record: DiamondRecord, actor: StaffUser): DiamondSalesView {
  const myHold = record.held_by_user_id === actor.id
  return {
    id:                      record.id,
    sku:                     record.sku,
    origin:                  record.origin,
    colour_category:         record.colour_category,
    colour_grade:            record.colour_grade,
    fancy_colour_hue:        record.fancy_colour_hue,
    fancy_colour_intensity:  record.fancy_colour_intensity,
    fancy_colour_overtone:   record.fancy_colour_overtone,
    shape:                   record.shape,
    carat:                   parseFloat(record.carat),
    clarity:                 record.clarity,
    cut:                     record.cut,
    polish:                  record.polish,
    symmetry:                record.symmetry,
    fluorescence:            record.fluorescence,
    meas_length_mm:          toNum(record.meas_length_mm),
    meas_width_mm:           toNum(record.meas_width_mm),
    meas_depth_mm:           toNum(record.meas_depth_mm),
    table_pct:               toNum(record.table_pct),
    depth_pct:               toNum(record.depth_pct),
    girdle:                  record.girdle,
    culet:                   record.culet,
    cert_lab:                record.cert_lab,
    cert_number:             record.cert_number,
    retail_price_amount:     record.retail_price_amount,
    retail_price_currency:   record.retail_price_currency,
    status:                  record.status,
    is_visible:              record.is_visible,
    isMyHold:                myHold,
    held_at:                 record.held_at,
    hold_expires_at:         record.hold_expires_at,
    hold_reason:             myHold ? record.hold_reason : null,
    selection_note:          record.selection_note,
    last_availability_check: record.last_availability_check,
    created_at:              record.created_at,
    updated_at:              record.updated_at,
    created_by:              record.created_by,
    updated_by:              record.updated_by,
    holdIsExpired:           isHoldExpired(record),
  }
}
