// Zod validation schemas for diamond inventory inputs.
// Used by server actions and API route handlers before calling service functions.

import { z } from 'zod'
import { FANCY_HUES } from './types'

// ── Enum arrays (mirror public.* PostgreSQL enums) ────────────────────────────

export const DIAMOND_SHAPES = [
  'round', 'oval', 'princess', 'emerald', 'cushion',
  'pear', 'marquise', 'radiant', 'asscher', 'heart',
  'trilliant', 'baguette', 'old_european', 'old_mine',
] as const

export const DIAMOND_COLOUR_GRADES    = ['D','E','F','G','H','I','J','K','L','M']                                                                     as const
export const FANCY_COLOUR_INTENSITIES = ['Faint','Very Light','Light','Fancy Light','Fancy','Fancy Intense','Fancy Vivid','Fancy Deep','Fancy Dark']    as const
export const DIAMOND_CLARITIES        = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2']                                                              as const
export const DIAMOND_CUTS             = ['Ideal','Excellent','Very Good','Good','Fair']                                                                 as const
export const DIAMOND_FINISHES         = ['Excellent','Very Good','Good','Fair']                                                                         as const
export const DIAMOND_FLUORESCENCES    = ['None','Faint','Medium','Strong','Very Strong']                                                                as const
export const CERTIFICATE_LABS         = ['GIA','IGI','HRD','AGS','GCAL']                                                                               as const
export const DIAMOND_STATUSES         = ['available','on_hold','reserved','sold','removed']                                                             as const
export const DIAMOND_ORIGINS          = ['natural','lab_grown']                                                                                         as const
export const COLOUR_CATEGORIES        = ['standard','fancy']                                                                                            as const

const ISO_CURRENCY = /^[A-Z]{3}$/

// Shared colour/certificate/visibility refinement.
// Applied to both create (full shape) and update (partial shape).
// For updates, only explicitly-included fields are checked here; the service layer
// validates the merged (current + patch) record before writing.
function addDiamondCrossFieldRules<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
): z.ZodEffects<z.ZodObject<T>> {
  return schema.superRefine((data, ctx) => {
    const d = data as Record<string, unknown>

    // Colour model mutual exclusion
    if (d.colour_category === 'standard') {
      if (d.colour_grade === null || d.colour_grade === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['colour_grade'],        message: 'colour_grade is required for standard colour category' })
      }
      if (d.fancy_colour_hue != null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fancy_colour_hue'],    message: 'fancy_colour_hue must be null for standard colour category' })
      }
      if (d.fancy_colour_intensity != null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fancy_colour_intensity'], message: 'fancy_colour_intensity must be null for standard colour category' })
      }
      if (d.fancy_colour_overtone != null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fancy_colour_overtone'], message: 'fancy_colour_overtone must be null for standard colour category' })
      }
    } else if (d.colour_category === 'fancy') {
      if (d.colour_grade != null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['colour_grade'],           message: 'colour_grade must be null for fancy colour category' })
      }
      if (d.fancy_colour_hue == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fancy_colour_hue'],       message: 'fancy_colour_hue is required for fancy colour category' })
      }
      if (d.fancy_colour_intensity == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fancy_colour_intensity'], message: 'fancy_colour_intensity is required for fancy colour category' })
      }
    }

    // Certificate pairing — both or neither
    const hasCertLab    = d.cert_lab != null
    const hasCertNumber = typeof d.cert_number === 'string' && d.cert_number.trim().length > 0
    if (hasCertLab !== hasCertNumber) {
      const missing = hasCertLab ? 'cert_number' : 'cert_lab'
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [missing], message: 'cert_lab and cert_number must both be provided or both be null' })
    }

    // Visibility gate
    if (d.is_visible === true) {
      if (d.cert_lab == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cert_lab'],    message: 'cert_lab is required when is_visible is true' })
      }
      if (typeof d.cert_number !== 'string' || (d.cert_number as string).trim().length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['cert_number'], message: 'cert_number is required when is_visible is true' })
      }
      if (typeof d.retail_price_amount !== 'number' || (d.retail_price_amount as number) <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['retail_price_amount'], message: 'A positive retail_price_amount is required when is_visible is true' })
      }
    }
  })
}

// ── DiamondBaseFields shared by both create and update ────────────────────────

const DiamondBaseShape = {
  origin:                 z.enum(DIAMOND_ORIGINS).default('natural'),
  supplier_id:            z.string().uuid().nullable().optional(),
  supplier_sku:           z.string().max(100).trim().nullable().optional(),
  colour_category:        z.enum(COLOUR_CATEGORIES).default('standard'),
  colour_grade:           z.enum(DIAMOND_COLOUR_GRADES).nullable().optional(),
  fancy_colour_hue:       z.enum(FANCY_HUES).nullable().optional(),
  fancy_colour_intensity: z.enum(FANCY_COLOUR_INTENSITIES).nullable().optional(),
  fancy_colour_overtone:  z.string().max(100).trim().nullable().optional(),
  shape:                  z.enum(DIAMOND_SHAPES),
  carat:                  z.number().positive().max(99.999),
  clarity:                z.enum(DIAMOND_CLARITIES),
  cut:                    z.enum(DIAMOND_CUTS).nullable().optional(),
  polish:                 z.enum(DIAMOND_FINISHES),
  symmetry:               z.enum(DIAMOND_FINISHES),
  fluorescence:           z.enum(DIAMOND_FLUORESCENCES).default('None'),
  meas_length_mm:         z.number().positive().nullable().optional(),
  meas_width_mm:          z.number().positive().nullable().optional(),
  meas_depth_mm:          z.number().positive().nullable().optional(),
  table_pct:              z.number().positive().max(100).nullable().optional(),
  depth_pct:              z.number().positive().max(100).nullable().optional(),
  girdle:                 z.string().max(100).trim().nullable().optional(),
  culet:                  z.string().max(100).trim().nullable().optional(),
  cert_lab:               z.enum(CERTIFICATE_LABS).nullable().optional(),
  cert_number:            z.string().min(1).max(100).trim().nullable().optional(),
  retail_price_amount:    z.number().int().positive().nullable().optional(),
  retail_price_currency:  z.string().regex(ISO_CURRENCY).default('AED'),
  supplier_cost_amount:   z.number().int().min(0).nullable().optional(),
  supplier_cost_currency: z.string().regex(ISO_CURRENCY).default('USD'),
  selection_note:         z.string().max(1000).trim().nullable().optional(),
  internal_notes:         z.string().max(5000).trim().nullable().optional(),
  is_visible:             z.boolean().default(false),
}

// Create: all required fields (shape, carat, clarity, polish, symmetry) must be present;
// cross-field rules enforce colour model and visibility constraints.
export const CreateDiamondSchema = addDiamondCrossFieldRules(z.object(DiamondBaseShape))
export type CreateDiamondInput   = z.infer<typeof CreateDiamondSchema>

// Update: every field is optional; only fields present in the patch are cross-field validated.
// The service layer additionally validates the merged (existing + patch) record.
export const UpdateDiamondSchema = addDiamondCrossFieldRules(z.object(DiamondBaseShape).partial())
export type UpdateDiamondInput   = z.infer<typeof UpdateDiamondSchema>

// ── Sort allowlist ─────────────────────────────────────────────────────────────
// Server-side allowlist — query parameters cannot select arbitrary DB columns.
export const DIAMOND_SORT_FIELDS = ['created_at', 'carat', 'retail_price_amount', 'status'] as const
export type DiamondSortField = (typeof DIAMOND_SORT_FIELDS)[number]

// ── Filter / pagination ───────────────────────────────────────────────────────
export const DiamondFilterSchema = z.object({
  // Basic filters
  status:          z.array(z.enum(DIAMOND_STATUSES)).optional(),
  shape:           z.array(z.enum(DIAMOND_SHAPES)).optional(),
  colour_category: z.enum(COLOUR_CATEGORIES).optional(),
  cert_lab:        z.enum(CERTIFICATE_LABS).optional(),
  min_carat:       z.number().positive().optional(),
  max_carat:       z.number().positive().optional(),
  min_price:       z.number().int().positive().optional(),
  max_price:       z.number().int().positive().optional(),
  // Privileged-only filters (scrubbed for sales_adviser in list-params.ts)
  is_visible:      z.boolean().optional(),
  supplier_id:     z.string().uuid().optional(),
  stale_check_days: z.number().int().min(1).max(365).optional(),
  // T5 extended filters
  origin:              z.enum(DIAMOND_ORIGINS).optional(),
  colour_grade:        z.enum(DIAMOND_COLOUR_GRADES).optional(),
  fancy_colour_hue:    z.enum(FANCY_HUES).optional(),
  fancy_colour_intensity: z.enum(FANCY_COLOUR_INTENSITIES).optional(),
  expired_hold:        z.boolean().optional(),
  // Sort (server-side allowlisted)
  sort_by:  z.enum(DIAMOND_SORT_FIELDS).default('created_at'),
  sort_dir: z.enum(['asc', 'desc'] as const).default('desc'),
  // Pagination
  page:     z.number().int().min(1).default(1),
  limit:    z.number().int().min(1).max(100).default(50),
})
export type DiamondFilter = z.infer<typeof DiamondFilterSchema>

// ── Hold schemas ──────────────────────────────────────────────────────────────
export const PlaceHoldSchema = z.object({
  diamond_id:      z.string().uuid(),
  hold_expires_at: z.string().datetime(),
  hold_reason:     z.string().min(1).max(500).trim(),
}).refine(
  (d) => new Date(d.hold_expires_at) > new Date(),
  { message: 'Hold expiry must be in the future', path: ['hold_expires_at'] },
)
export type PlaceHoldInput = z.infer<typeof PlaceHoldSchema>

export const ExtendHoldSchema = z.object({
  diamond_id:     z.string().uuid(),
  new_expires_at: z.string().datetime(),
  hold_reason:    z.string().max(500).trim().optional(),
}).refine(
  (d) => new Date(d.new_expires_at) > new Date(),
  { message: 'New expiry must be in the future', path: ['new_expires_at'] },
)
export type ExtendHoldInput = z.infer<typeof ExtendHoldSchema>

export const TransitionStatusSchema = z.object({
  diamond_id:      z.string().uuid(),
  new_status:      z.enum(DIAMOND_STATUSES),
  hold_expires_at: z.string().datetime().optional(),
  hold_reason:     z.string().min(1).max(500).trim().optional(),
}).superRefine((d, ctx) => {
  if (d.new_status === 'on_hold') {
    if (!d.hold_expires_at) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hold_expires_at'], message: 'hold_expires_at is required when transitioning to on_hold' })
    } else if (new Date(d.hold_expires_at) <= new Date()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hold_expires_at'], message: 'Hold expiry must be in the future' })
    }
    if (!d.hold_reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hold_reason'], message: 'hold_reason is required when transitioning to on_hold' })
    }
  }
})
export type TransitionStatusInput = z.infer<typeof TransitionStatusSchema>

// ── Upload metadata schemas ───────────────────────────────────────────────────
export const MediaUploadMetaSchema = z.object({
  diamond_id:    z.string().uuid(),
  display_order: z.number().int().min(0).max(99).default(0),
  alt_text:      z.string().max(200).trim().nullable().optional(),
  is_primary:    z.boolean().default(false),
})
export type MediaUploadMeta = z.infer<typeof MediaUploadMetaSchema>

export const CertUploadMetaSchema = z.object({
  diamond_id:  z.string().uuid(),
  cert_lab:    z.enum(CERTIFICATE_LABS),
  cert_number: z.string().min(1).max(100).trim(),
})
export type CertUploadMeta = z.infer<typeof CertUploadMetaSchema>
