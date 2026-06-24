'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { updateEarringStone, deleteEarringStone } from '@/lib/earring-stones/service'
import { UpdateEarringStoneSchema } from '@/lib/earring-stones/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { EarringStoneActionResult, EarringStoneSimpleResult } from '../types'
import { parseEarringStoneFormData, zodErrors } from '../form-utils'

export async function updateEarringStoneAction(
  id: string,
  _prev: EarringStoneActionResult,
  formData: FormData,
): Promise<EarringStoneActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const parsed = UpdateEarringStoneSchema.safeParse(parseEarringStoneFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  try {
    await updateEarringStone(id, parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'earring_stone.update',
      entityType:  'earring_stone',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update earring stone.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/earring-stones/${id}`)
}

export async function deleteEarringStoneAction(
  id: string,
  _prev: EarringStoneSimpleResult,
  _formData: FormData,
): Promise<EarringStoneSimpleResult> {
  const actor = await requireStaffRole(['super_admin'])

  try {
    await deleteEarringStone(id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'earring_stone.delete',
      entityType:  'earring_stone',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete earring stone.'
    return { success: false, message }
  }

  redirect('/admin/earring-stones')
}
