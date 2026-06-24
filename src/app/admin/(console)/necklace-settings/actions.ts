'use server'

import { redirect } from 'next/navigation'
import { requireStaffRole } from '@/lib/staff'
import { createNecklaceSetting } from '@/lib/necklace-settings/service'
import { CreateNecklaceSettingSchema } from '@/lib/necklace-settings/schemas'
import { writeAuditLog } from '@/lib/audit'
import type { NecklaceSettingActionResult } from './types'

export async function createNecklaceSettingAction(
  _prev: NecklaceSettingActionResult,
  formData: FormData,
): Promise<NecklaceSettingActionResult> {
  const actor = await requireStaffRole(['super_admin'])

  const raw = {
    name:              formData.get('name'),
    slug:              formData.get('slug'),
    collection:        formData.get('collection') || null,
    style:             formData.get('style') || null,
    short_description: formData.get('short_description') || null,
    description:       formData.get('description') || null,
    metals:            formData.getAll('metals'),
    chain_lengths_cm:  formData.get('chain_lengths_cm') ?? '',
    base_price_gbp:    formData.get('base_price_gbp') || null,
    status:            formData.get('status') ?? 'available',
    is_published:      formData.getAll('is_published').includes('true'),
    sort_order:        formData.get('sort_order') ?? 0,
  }

  const parsed = CreateNecklaceSettingSchema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    parsed.error.errors.forEach((e) => { fieldErrors[e.path.join('.')] = e.message })
    return { success: false, message: 'Please fix the errors below.', fieldErrors }
  }

  let newId: string
  try {
    const setting = await createNecklaceSetting(parsed.data, actor.id)
    await writeAuditLog({
      actorUserId: actor.id,
      action:      'necklace_setting.create',
      entityType:  'necklace_setting',
      entityId:    setting.id,
      metadata:    { name: setting.name },
    })
    newId = setting.id
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create necklace setting.'
    return { success: false, message, fieldErrors: {} }
  }

  redirect(`/admin/necklace-settings/${newId}`)
}
