// Zod validation schemas for diamond and ring setting admin inputs.

import { z } from 'zod'

// ── Enum arrays ───────────────────────────────────────────────────────────────

export const DIAMOND_CUTS = [
  'round', 'princess', 'cushion', 'oval', 'emerald',
  'pear', 'marquise', 'radiant', 'asscher', 'heart',
] as const

export const DIAMOND_COLOURS    = ['D','E','F','G','H','I','J'] as const
export const DIAMOND_CLARITIES  = ['FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2'] as const
export const DIAMOND_GRADES     = ['excellent','very_good','good','fair','poor'] as const
export const DIAMOND_FLUORESCENCES = ['none','faint','medium','strong','very_strong'] as const
export const DIAMOND_STATUSES   = ['available','sold'] as const
export const RING_METALS        = [
  'platinum','white_gold_18k','yellow_gold_18k','rose_gold_18k',
  'white_gold_9k','yellow_gold_9k',
] as const

// ── Diamond schemas ───────────────────────────────────────────────────────────

export const CreateDiamondSchema = z.object({
  ring_setting_id:    z.string().uuid().nullable().optional(),
  cut:                z.enum(DIAMOND_CUTS),
  carat:              z.number().positive().max(50),
  colour:             z.enum(DIAMOND_COLOURS),
  clarity:            z.enum(DIAMOND_CLARITIES),
  cut_grade:          z.enum(DIAMOND_GRADES).nullable().optional(),
  polish:             z.enum(DIAMOND_GRADES).nullable().optional(),
  symmetry:           z.enum(DIAMOND_GRADES).nullable().optional(),
  fluorescence:       z.enum(DIAMOND_FLUORESCENCES).default('none'),
  gia_report_number:  z.string().max(20).nullable().optional(),
  gia_report_date:    z.string().nullable().optional(),
  gia_report_url:     z.string().url('Must be a valid URL').nullable().optional(),
  measurement_length: z.number().positive().nullable().optional(),
  measurement_width:  z.number().positive().nullable().optional(),
  measurement_depth:  z.number().positive().nullable().optional(),
  depth_pct:          z.number().positive().max(100).nullable().optional(),
  table_pct:          z.number().positive().max(100).nullable().optional(),
  price_gbp:          z.number().nonnegative(),
  is_published:       z.boolean().default(false),
  notes:              z.string().max(2000).nullable().optional(),
})

export type CreateDiamondInput = z.infer<typeof CreateDiamondSchema>

export const UpdateDiamondSchema = CreateDiamondSchema.partial().extend({
  status: z.enum(DIAMOND_STATUSES).optional(),
})

export type UpdateDiamondInput = z.infer<typeof UpdateDiamondSchema>

// ── Ring setting schemas ──────────────────────────────────────────────────────

export const CreateRingSettingSchema = z.object({
  name:           z.string().min(1).max(200),
  slug:           z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug: lowercase, numbers and hyphens only'),
  collection:     z.string().max(200).nullable().optional(),
  description:    z.string().max(5000).nullable().optional(),
  metals:         z.array(z.enum(RING_METALS)).min(1, 'Select at least one metal'),
  base_price_gbp: z.number().nonnegative().nullable().optional(),
  is_published:   z.boolean().default(false),
  sort_order:     z.number().int().min(0).default(0),
})

export type CreateRingSettingInput = z.infer<typeof CreateRingSettingSchema>

export const UpdateRingSettingSchema = CreateRingSettingSchema.partial()
export type UpdateRingSettingInput  = z.infer<typeof UpdateRingSettingSchema>

// ── Form parsing helpers ──────────────────────────────────────────────────────

export function parseDiamondFormData(fd: FormData): Record<string, unknown> {
  const numFields  = ['carat','price_gbp','measurement_length','measurement_width','measurement_depth','depth_pct','table_pct']
  const nullFields = ['ring_setting_id','cut_grade','polish','symmetry','gia_report_number','gia_report_date','gia_report_url','measurement_length','measurement_width','measurement_depth','depth_pct','table_pct','notes']
  const out: Record<string, unknown> = {}
  for (const [key, value] of fd.entries()) {
    if (key === 'is_published') continue
    const str = typeof value === 'string' ? value.trim() : value
    if (nullFields.includes(key) && str === '') { out[key] = null }
    else if (numFields.includes(key) && str !== '') { out[key] = parseFloat(str as string) }
    else { out[key] = str }
  }
  out.is_published = fd.get('is_published') === 'on'
  return out
}

export function parseRingSettingFormData(fd: FormData): Record<string, unknown> {
  const nullFields = ['collection','description']
  const out: Record<string, unknown> = {}
  for (const [key, value] of fd.entries()) {
    if (key === 'metals' || key === 'is_published') continue
    const str = typeof value === 'string' ? value.trim() : value
    if (nullFields.includes(key) && str === '') { out[key] = null }
    else if (key === 'base_price_gbp') { out[key] = str === '' ? null : parseFloat(str as string) }
    else if (key === 'sort_order')     { out[key] = parseInt(str as string, 10) }
    else { out[key] = str }
  }
  out.metals      = fd.getAll('metals') as string[]
  out.is_published = fd.get('is_published') === 'on'
  return out
}

export function zodErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.')
    if (!out[key]) out[key] = issue.message
  }
  return out
}
