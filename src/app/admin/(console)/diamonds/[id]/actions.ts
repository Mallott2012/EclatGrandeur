'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { updateDiamond, deleteDiamond } from '@/lib/diamonds/service'
import { UpdateDiamondSchema, parseDiamondFormData, zodErrors } from '@/lib/diamonds/schemas'
import type { DiamondActionResult, DiamondSimpleResult } from '../types'

function serviceMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred'
}

// ── Edit ──────────────────────────────────────────────────────────────────────

export async function updateDiamondAction(
  id:       string,
  _state:   DiamondActionResult,
  formData: FormData,
): Promise<DiamondActionResult> {
  const actor  = await requireStaffRole(['super_admin', 'diamond_buyer'])
  const parsed = UpdateDiamondSchema.safeParse(parseDiamondFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please correct the errors below.', fieldErrors: zodErrors(parsed.error) }
  }
  try {
    await updateDiamond(actor, id, parsed.data)
  } catch (err) {
    return { success: false, message: serviceMsg(err), fieldErrors: {} }
  }
  redirect(`/admin/diamonds/${id}`)
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteDiamondAction(
  id:       string,
  _state:   DiamondSimpleResult,
  _formData: FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin'])
  try {
    await deleteDiamond(actor, id)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }
  redirect('/admin/diamonds')
}
