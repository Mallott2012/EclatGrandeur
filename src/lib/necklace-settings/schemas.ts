import { z } from 'zod'
import { ALL_METALS, ALL_PRODUCT_STATUSES } from '@/lib/catalogue/enums'

const metalEnum = z.enum(ALL_METALS as [string, ...string[]])
const statusEnum = z.enum(ALL_PRODUCT_STATUSES as [string, ...string[]])

// Parse a comma/space separated list of integers (chain lengths in cm) → number[].
const chainLengths = z.preprocess((v) => {
  if (Array.isArray(v)) return v.map(Number).filter((n) => Number.isFinite(n))
  if (typeof v === 'string') {
    return v.split(/[,\s]+/).map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0)
  }
  return []
}, z.array(z.number().int().positive()).default([]))

export const CreateNecklaceSettingSchema = z.object({
  name:              z.string().min(1, 'Name is required').max(120),
  slug:              z.string().min(1, 'Slug is required').max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  collection:        z.string().max(80).optional().nullable(),
  style:             z.string().max(40).optional().nullable(),
  short_description: z.string().max(160, 'Keep the teaser under 160 characters').optional().nullable(),
  description:       z.string().max(4000).optional().nullable(),
  metals:            z.array(metalEnum).min(1, 'Select at least one metal'),
  chain_lengths_cm:  chainLengths,
  base_price_gbp:    z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().nonnegative().nullable().optional(),
  ),
  status:            statusEnum.default('available'),
  is_published:      z.boolean().default(false),
  sort_order:        z.preprocess((v) => Number(v) || 0, z.number().int().min(0)).default(0),
})

export const UpdateNecklaceSettingSchema = CreateNecklaceSettingSchema.partial()

export type CreateNecklaceSettingInput = z.infer<typeof CreateNecklaceSettingSchema>
export type UpdateNecklaceSettingInput = z.infer<typeof UpdateNecklaceSettingSchema>
