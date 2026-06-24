'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { updateBraceletStone, deleteBraceletStone } from '@/lib/bracelet-stones/service'
import { UpdateBraceletStoneSchema } from '@/lib/bracelet-stones/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { BraceletStoneActionResult, BraceletStoneSimpleResult } from '../types'
import { parseBraceletStoneFormData, zodErrors } from '../form-utils'

export async function updateBraceletStoneAction(
  id: string,
  _prev: BraceletStoneActionResult,
  formData: FormData,
): Promise<BraceletStoneActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const parsed = UpdateBraceletStoneSchema.safeParse(parseBraceletStoneFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  try {
    await updateBraceletStone(id, parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'bracelet_stone.update',
      entityType:  'bracelet_stone',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update bracelet stone.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/bracelet-stones/${id}`)
}

export async function deleteBraceletStoneAction(
  id: string,
  _prev: BraceletStoneSimpleResult,
  _formData: FormData,
): Promise<BraceletStoneSimpleResult> {
  const actor = await requireStaffRole(['super_admin'])

  try {
    await deleteBraceletStone(id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'bracelet_stone.delete',
      entityType:  'bracelet_stone',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete bracelet stone.'
    return { success: false, message }
  }

  redirect('/admin/bracelet-stones')
}
