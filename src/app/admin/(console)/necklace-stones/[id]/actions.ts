'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { updateNecklaceStone, deleteNecklaceStone } from '@/lib/necklace-stones/service'
import { UpdateNecklaceStoneSchema } from '@/lib/necklace-stones/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { NecklaceStoneActionResult, NecklaceStoneSimpleResult } from '../types'
import { parseNecklaceStoneFormData, zodErrors } from '../form-utils'

export async function updateNecklaceStoneAction(
  id: string,
  _prev: NecklaceStoneActionResult,
  formData: FormData,
): Promise<NecklaceStoneActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const parsed = UpdateNecklaceStoneSchema.safeParse(parseNecklaceStoneFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  try {
    await updateNecklaceStone(id, parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'necklace_stone.update',
      entityType:  'necklace_stone',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update necklace stone.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/necklace-stones/${id}`)
}

export async function deleteNecklaceStoneAction(
  id: string,
  _prev: NecklaceStoneSimpleResult,
  _formData: FormData,
): Promise<NecklaceStoneSimpleResult> {
  const actor = await requireStaffRole(['super_admin'])

  try {
    await deleteNecklaceStone(id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'necklace_stone.delete',
      entityType:  'necklace_stone',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete necklace stone.'
    return { success: false, message }
  }

  redirect('/admin/necklace-stones')
}
