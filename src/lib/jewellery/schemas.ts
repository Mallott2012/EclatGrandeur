// Zod validation schemas for jewellery product admin inputs.

import { z } from 'zod'
import { RING_METALS } from '@/lib/diamonds/schemas'

export const JEWELLERY_CATEGORIES = ['earrings', 'necklaces', 'bracelets'] as const

export const CreateJewelleryProductSchema = z.object({
  slug:           z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Slug: lowercase, numbers and hyphens only'),
  category:       z.enum(JEWELLERY_CATEGORIES),
  name:           z.string().min(1).max(200),
  subtitle:       z.string().max(300).nullable().optional(),
  description:    z.string().max(5000).nullable().optional(),
  base_price_gbp: z.number().nonnegative(),
  metals:         z.array(z.enum(RING_METALS)).min(1, 'Select at least one metal'),
  show_diamond:   z.boolean().default(true),
  is_total_carat: z.boolean().default(false),
  is_pair:        z.boolean().default(false),
  is_published:   z.boolean().default(false),
  sort_order:     z.number().int().min(0).default(0),
})

export type CreateJewelleryProductInput = z.infer<typeof CreateJewelleryProductSchema>

export const UpdateJewelleryProductSchema = CreateJewelleryProductSchema.partial()
export type UpdateJewelleryProductInput  = z.infer<typeof UpdateJewelleryProductSchema>

// ── Form parsing helper ───────────────────────────────────────────────────────

export function parseJewelleryProductFormData(fd: FormData): Record<string, unknown> {
  const nullFields = ['subtitle', 'description']
  const out: Record<string, unknown> = {}
  for (const [key, value] of fd.entries()) {
    if (['metals', 'is_published', 'show_diamond', 'is_total_carat', 'is_pair'].includes(key)) continue
    const str = typeof value === 'string' ? value.trim() : value
    if (nullFields.includes(key) && str === '')       { out[key] = null }
    else if (key === 'base_price_gbp')                { out[key] = str === '' ? 0 : parseFloat(str as string) }
    else if (key === 'sort_order')                    { out[key] = parseInt(str as string, 10) || 0 }
    else                                              { out[key] = str }
  }
  out.metals         = fd.getAll('metals')
  out.is_published   = fd.get('is_published')   === 'on'
  out.show_diamond   = fd.get('show_diamond')   === 'on'
  out.is_total_carat = fd.get('is_total_carat') === 'on'
  out.is_pair        = fd.get('is_pair')        === 'on'
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
