'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createRingSetting } from '@/lib/ring-settings/service'
import { CreateRingSettingSchema } from '@/lib/ring-settings/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { RingSettingActionResult } from './types'
import { RING_SETTING_ACTION_INITIAL } from './types'

export async function createRingSettingAction(
  _prev: RingSettingActionResult,
  formData: FormData,
): Promise<RingSettingActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const raw = {
    name:              formData.get('name'),
    slug:              formData.get('slug'),
    collection:        formData.get('collection') || null,
    short_description: formData.get('short_description') || null,
    description:       formData.get('description') || null,
    metals:            formData.getAll('metals'),
    base_price_gbp:    formData.get('base_price_gbp') || null,
    status:            formData.get('status') ?? 'available',
    is_published:      formData.getAll('is_published').includes('true'),
    sort_order:        formData.get('sort_order') ?? 0,
  }

  const parsed = CreateRingSettingSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.errors.forEach((e) => {
      const key = e.path.join('.')
      fieldErrors[key] = e.message
    })
    return { success: false, message: 'Please fix the errors below.', fieldErrors }
  }

  // redirect() throws NEXT_REDIRECT; it must live OUTSIDE the try/catch so the
  // catch below cannot swallow it. `id` is captured on success and used after.
  let newId: string
  try {
    const setting = await createRingSetting(parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'ring_setting.create',
      entityType:  'ring_setting',
      entityId:    setting.id,
      metadata:    { name: setting.name },
    })
    newId = setting.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create ring setting.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/ring-settings/${newId}`)
}
