// Zod validation schemas for supplier inputs.

import { z } from 'zod'

const ISO_CURRENCY = /^[A-Z]{3}$/
const EMAIL_OR_NULL = z.string().email().nullable().optional()

export const CreateSupplierSchema = z.object({
  name:         z.string().min(1).max(200).trim(),
  code:         z.string().min(1).max(20).trim().regex(/^[A-Z0-9_-]+$/, 'code must be uppercase alphanumeric, hyphens or underscores'),
  contact_name: z.string().max(200).trim().nullable().optional(),
  email:        EMAIL_OR_NULL,
  phone:        z.string().max(50).trim().nullable().optional(),
  country:      z.string().max(100).trim().nullable().optional(),
  currency:     z.string().regex(ISO_CURRENCY).default('USD'),
  notes:        z.string().max(5000).trim().nullable().optional(),
  is_active:    z.boolean().default(true),
})
export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>

export const UpdateSupplierSchema = CreateSupplierSchema.partial()
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>

export const SupplierFilterSchema = z.object({
  is_active: z.boolean().optional(),
  currency:  z.string().regex(ISO_CURRENCY).optional(),
  page:      z.number().int().min(1).default(1),
  limit:     z.number().int().min(1).max(100).default(50),
})
export type SupplierFilter = z.infer<typeof SupplierFilterSchema>
