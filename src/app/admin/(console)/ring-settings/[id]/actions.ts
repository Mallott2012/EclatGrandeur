'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { updateRingSetting, deleteRingSetting } from '@/lib/ring-settings/service'
import { UpdateRingSettingSchema } from '@/lib/ring-settings/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { RingSettingActionResult, RingSettingSimpleResult } from '../types'
import { RING_SETTING_SIMPLE_INITIAL } from '../types'

export async function updateRingSettingAction(
  id: string,
  _prev: RingSettingActionResult,
  formData: FormData,
): Promise<RingSettingActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const raw = {
    name:           formData.get('name'),
    slug:           formData.get('slug'),
    collection:     formData.get('collection') || null,
    description:    formData.get('description') || null,
    metals:         formData.getAll('metals'),
    base_price_gbp: formData.get('base_price_gbp') || null,
    is_published:   formData.get('is_published') === 'true',
    sort_order:     formData.get('sort_order') ?? 0,
  }

  const parsed = UpdateRingSettingSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.errors.forEach((e) => {
      fieldErrors[e.path.join('.')] = e.message
    })
    return { success: false, message: 'Please fix the errors below.', fieldErrors }
  }

  try {
    await updateRingSetting(id, parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'ring_setting.update',
      entityType:  'ring_setting',
      entityId:    id,
      metadata:    {},
    })
    redirect(`/admin/ring-settings/${id}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update ring setting.'
    return { success: false, message, fieldErrors: {} }
  }
}

export async function deleteRingSettingAction(
  id: string,
  _prev: RingSettingSimpleResult,
  _formData: FormData,
): Promise<RingSettingSimpleResult> {
  const actor = await requireStaffRole(['super_admin'])

  try {
    await deleteRingSetting(id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'ring_setting.delete',
      entityType:  'ring_setting',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete ring setting.'
    return { success: false, message }
  }

  redirect('/admin/ring-settings')
}
