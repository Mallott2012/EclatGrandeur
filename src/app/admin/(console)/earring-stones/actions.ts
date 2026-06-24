'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createEarringStone } from '@/lib/earring-stones/service'
import { CreateEarringStoneSchema } from '@/lib/earring-stones/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { EarringStoneActionResult } from './types'
import { parseEarringStoneFormData, zodErrors } from './form-utils'

export async function createEarringStoneAction(
  _prev: EarringStoneActionResult,
  formData: FormData,
): Promise<EarringStoneActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const parsed = CreateEarringStoneSchema.safeParse(parseEarringStoneFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  let newId: string
  try {
    const stone = await createEarringStone(parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'earring_stone.create',
      entityType:  'earring_stone',
      entityId:    stone.id,
      metadata:    { sku: stone.sku },
    })
    newId = stone.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create earring stone.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/earring-stones/${newId}`)
}
