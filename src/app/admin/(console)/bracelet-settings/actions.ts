'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createBraceletSetting } from '@/lib/bracelet-settings/service'
import { CreateBraceletSettingSchema } from '@/lib/bracelet-settings/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { BraceletSettingActionResult } from './types'

export async function createBraceletSettingAction(
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

  const parsed = CreateBraceletSettingSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.errors.forEach((e) => { fieldErrors[e.path.join('.')] = e.message })
    return { success: false, message: 'Please fix the errors below.', fieldErrors }
  }

  let newId: string
  try {
    const setting = await createBraceletSetting(parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'bracelet_setting.create',
      entityType:  'bracelet_setting',
      entityId:    setting.id,
      metadata:    { name: setting.name },
    })
    newId = setting.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create bracelet setting.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/bracelet-settings/${newId}`)
}
