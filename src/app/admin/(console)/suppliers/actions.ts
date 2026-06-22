'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createSupplier, patchSupplier, deactivateSupplier } from '@/lib/suppliers/service'
import { CreateSupplierSchema, UpdateSupplierSchema } from '@/lib/suppliers/schemas'
import type { SupplierActionResult } from './types'

// ── Form data → object ────────────────────────────────────────────────────────

function str(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? ''
}

function nullableStr(formData: FormData, key: string): string | null {
  const v = (formData.get(key) as string | null)?.trim() ?? ''
  return v.length > 0 ? v : null
}

function parseFormData(formData: FormData) {
  return {
    name:         str(formData, 'name'),
    code:         str(formData, 'code'),
    contact_name: nullableStr(formData, 'contact_name'),
    email:        nullableStr(formData, 'email'),
    phone:        nullableStr(formData, 'phone'),
    country:      nullableStr(formData, 'country'),
    currency:     str(formData, 'currency') || 'USD',
    notes:        nullableStr(formData, 'notes'),
    is_active:    formData.get('is_active') === 'on',
  }
}

// ── Zod error → flat field error map ─────────────────────────────────────────

function zodErrors(err: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of err.errors) {
    const key = issue.path[0]?.toString() ?? '_form'
    if (!out[key]) out[key] = issue.message
  }
  return out
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createSupplierAction(
  _state:   SupplierActionResult,
  formData: FormData,
): Promise<SupplierActionResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  const parsed = CreateSupplierSchema.safeParse(parseFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  let newId: string
  try {
    const supplier = await createSupplier(actor, parsed.data)
    newId = supplier.id
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, message: msg, fieldErrors: {} }
  }

  redirect(`/admin/suppliers/${newId}`)
}

export async function updateSupplierAction(
  id:       string,
  _state:   SupplierActionResult,
  formData: FormData,
): Promise<SupplierActionResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  const parsed = UpdateSupplierSchema.safeParse(parseFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  try {
    await patchSupplier(actor, id, parsed.data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, message: msg, fieldErrors: {} }
  }

  redirect(`/admin/suppliers/${id}`)
}

export async function deactivateSupplierAction(
  id: string,
): Promise<{ success: false; message: string } | { success: true }> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])

  try {
    await deactivateSupplier(actor, id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'An unexpected error occurred'
    return { success: false, message: msg }
  }

  redirect(`/admin/suppliers/${id}`)
}
