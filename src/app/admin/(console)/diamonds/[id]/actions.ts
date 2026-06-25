'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireStaffRole } from '@/lib/staff'
import { updateDiamond, deleteDiamond, approveEclatDiamond, revokeEclatApproval } from '@/lib/diamonds/service'
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

// ── Éclat approval ────────────────────────────────────────────────────────────

export async function approveEclatDiamondAction(
  id:       string,
  _state:   DiamondSimpleResult,
  formData: FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])
  const note  = (formData.get('approval_note') as string | null)?.trim() || null
  try {
    await approveEclatDiamond(actor, id, note)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }
  revalidatePath(`/admin/diamonds/${id}`)
  return { success: true }
}

export async function revokeEclatApprovalAction(
  id:     string,
  _state: DiamondSimpleResult,
  _fd:    FormData,
): Promise<DiamondSimpleResult> {
  const actor = await requireStaffRole(['super_admin', 'diamond_buyer'])
  try {
    await revokeEclatApproval(actor, id)
  } catch (err) {
    return { success: false, message: serviceMsg(err) }
  }
  revalidatePath(`/admin/diamonds/${id}`)
  return { success: true }
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
