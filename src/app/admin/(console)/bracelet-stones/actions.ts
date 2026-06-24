'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createBraceletStone } from '@/lib/bracelet-stones/service'
import { CreateBraceletStoneSchema } from '@/lib/bracelet-stones/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { BraceletStoneActionResult } from './types'
import { parseBraceletStoneFormData, zodErrors } from './form-utils'

export async function createBraceletStoneAction(
  _prev: BraceletStoneActionResult,
  formData: FormData,
): Promise<BraceletStoneActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const parsed = CreateBraceletStoneSchema.safeParse(parseBraceletStoneFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  let newId: string
  try {
    const stone = await createBraceletStone(parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'bracelet_stone.create',
      entityType:  'bracelet_stone',
      entityId:    stone.id,
      metadata:    { sku: stone.sku },
    })
    newId = stone.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create bracelet stone.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/bracelet-stones/${newId}`)
}
