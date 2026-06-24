'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { updateBraceletSetting, deleteBraceletSetting } from '@/lib/bracelet-settings/service'
import { UpdateBraceletSettingSchema } from '@/lib/bracelet-settings/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { BraceletSettingActionResult, BraceletSettingSimpleResult } from '../types'

export async function updateBraceletSettingAction(
  id: string,
  _prev: BraceletSettingActionResult,
  formData: FormData,
): Promise<BraceletSettingActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const raw = {
    name:              formData.get('name'),
    slug:              formData.get('slug'),
    collection:        formData.get('collection') || null,
    style:             formData.get('style') || null,
    short_description: formData.get('short_description') || null,
    description:       formData.get('description') || null,
    metals:            formData.getAll('metals'),
    sizes_cm:  formData.get('sizes_cm') ?? '',
    base_price_gbp:    formData.get('base_price_gbp') || null,
    status:            formData.get('status') ?? 'available',
    is_published:      formData.getAll('is_published').includes('true'),
    sort_order:        formData.get('sort_order') ?? 0,
  }

  const parsed = UpdateBraceletSettingSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.errors.forEach((e) => { fieldErrors[e.path.join('.')] = e.message })
    return { success: false, message: 'Please fix the errors below.', fieldErrors }
  }

  try {
    await updateBraceletSetting(id, parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'bracelet_setting.update',
      entityType:  'bracelet_setting',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update bracelet setting.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/bracelet-settings/${id}`)
}

export async function deleteBraceletSettingAction(
  id: string,
  _prev: BraceletSettingSimpleResult,
  _formData: FormData,
): Promise<BraceletSettingSimpleResult> {
  const actor = await requireStaffRole(['super_admin'])

  try {
    await deleteBraceletSetting(id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'bracelet_setting.delete',
      entityType:  'bracelet_setting',
      entityId:    id,
      metadata:    {},
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete bracelet setting.'
    return { success: false, message }
  }

  redirect('/admin/bracelet-settings')
}
