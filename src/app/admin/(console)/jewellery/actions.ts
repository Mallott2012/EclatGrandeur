'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import {
  createJewelleryProduct,
  updateJewelleryProduct,
  deleteJewelleryProduct,
} from '@/lib/jewellery/service'
import {
  CreateJewelleryProductSchema,
  UpdateJewelleryProductSchema,
  parseJewelleryProductFormData,
  zodErrors,
} from '@/lib/jewellery/schemas'
import type { JewelleryActionResult } from './types'

export async function createJewelleryAction(
  _state:   JewelleryActionResult,
  formData: FormData,
): Promise<JewelleryActionResult> {
  const actor  = await requireStaffRole(['super_admin', 'content_editor'])
  const parsed = CreateJewelleryProductSchema.safeParse(parseJewelleryProductFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }
  let newId: string
  try {
    const product = await createJewelleryProduct(actor, parsed.data)
    newId = product.id
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'An unexpected error occurred.', fieldErrors: {} }
  }
  redirect(`/admin/jewellery/${newId}`)
}

export async function updateJewelleryAction(
  id:      string,
  _state:  JewelleryActionResult,
  formData: FormData,
): Promise<JewelleryActionResult> {
  const actor  = await requireStaffRole(['super_admin', 'content_editor'])
  const parsed = UpdateJewelleryProductSchema.safeParse(parseJewelleryProductFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }
  try {
    await updateJewelleryProduct(actor, id, parsed.data)
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'An unexpected error occurred.', fieldErrors: {} }
  }
  return { success: true }
}

export async function deleteJewelleryAction(id: string): Promise<void> {
  const actor = await requireStaffRole(['super_admin'])
  await deleteJewelleryProduct(actor, id)
  redirect('/admin/jewellery')
}
