'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { updateEarringSetting, deleteEarringSetting } from '@/lib/earring-settings/service'
import { UpdateEarringSettingSchema } from '@/lib/earring-settings/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { EarringSettingActionResult, EarringSettingSimpleResult } from '../types'

export async function updateEarringSettingAction(
  id: string,
  _prev: EarringSettingActionResult,
  formData: FormData,
): Promise<EarringSettingActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const raw = {
    name:              formData.get('name'),
    slug:              formData.get('slug'),
    collection:        formData.get('collection') || null,
    style:             formData.get('style') || null,
    short_description: formData.get('short_description') || null,
    description:       formData.get('description') || null,
    metals:            formData.getAll('metals'),
    is_pair:           formData.getAll('is_pair').includes('true'),
    base_price_gbp:    formData.get('base_price_gbp') || null,
    status:            formData.get('status') ?? 'available',
    is_published:      formData.getAll('is_published').includes('true'),
    sort_order:        formData.get('sort_order') ?? 0,
  }

  const parsed = UpdateEarringSettingSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.errors.forEach((e) => { fieldErrors[e.path.join('.')] = e.message })
    return { success: false, message: 'Please fix the errors below.', fieldErrors }
  }

  try {
    await updateEarringSetting(id, parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'earring_setting.update',
      entityType:  'earring_setting',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update earring setting.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/earring-settings/${id}`)
}

export async function deleteEarringSettingAction(
  id: string,
  _prev: EarringSettingSimpleResult,
  _formData: FormData,
): Promise<EarringSettingSimpleResult> {
  const actor = await requireStaffRole(['super_admin'])

  try {
    await deleteEarringSetting(id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'earring_setting.delete',
      entityType:  'earring_setting',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete earring setting.'
    return { success: false, message }
  }

  redirect('/admin/earring-settings')
}
