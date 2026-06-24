import { z } from 'zod'
import { ALL_METALS } from './types'

const metalEnum = z.enum(ALL_METALS as [string, ...string[]] as [
  'platinum', 'white_gold_18k', 'yellow_gold_18k', 'rose_gold_18k', 'white_gold_9k', 'yellow_gold_9k'
])

export const CreateRingSettingSchema = z.object({
  name:           z.string().min(1, 'Name is required').max(120),
  slug:           z.string().min(1, 'Slug is required').max(80).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers and hyphens only'),
  collection:     z.string().max(80).optional().nullable(),
  description:    z.string().max(2000).optional().nullable(),
  metals:         z.array(metalEnum).min(1, 'Select at least one metal'),
  base_price_gbp: z.preprocess(
    (v) => (v === '' || v == null ? null : Number(v)),
    z.number().positive().nullable().optional(),
  ),
  is_published:   z.boolean().default(false),
  sort_order:     z.preprocess((v) => Number(v) || 0, z.number().int().min(0)).default(0),
})

export const UpdateRingSettingSchema = CreateRingSettingSchema.partial()

export type CreateRingSettingInput = z.infer<typeof CreateRingSettingSchema>
export type UpdateRingSettingInput = z.infer<typeof UpdateRingSettingSchema>
