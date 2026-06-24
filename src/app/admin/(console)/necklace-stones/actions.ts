'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createNecklaceStone } from '@/lib/necklace-stones/service'
import { CreateNecklaceStoneSchema } from '@/lib/necklace-stones/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { NecklaceStoneActionResult } from './types'
import { parseNecklaceStoneFormData, zodErrors } from './form-utils'

export async function createNecklaceStoneAction(
  _prev: NecklaceStoneActionResult,
  formData: FormData,
): Promise<NecklaceStoneActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const parsed = CreateNecklaceStoneSchema.safeParse(parseNecklaceStoneFormData(formData))
  if (!parsed.success) {
    return { success: false, message: 'Please fix the errors below.', fieldErrors: zodErrors(parsed.error) }
  }

  let newId: string
  try {
    const stone = await createNecklaceStone(parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'necklace_stone.create',
      entityType:  'necklace_stone',
      entityId:    stone.id,
      metadata:    { sku: stone.sku },
    })
    newId = stone.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create necklace stone.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/necklace-stones/${newId}`)
}
