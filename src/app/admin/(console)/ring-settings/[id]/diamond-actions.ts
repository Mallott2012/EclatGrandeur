'use server'

import { revalidatePath } from 'next/cache'
import { requireStaffRole } from '@/lib/staff'
import {
  assignDiamondToRingSetting,
  unassignDiamondFromRingSetting,
} from '@/lib/ring-settings/service'

export async function assignRingDiamondAction(
  ringSettingId: string,
  metal: string,
  diamondId: string,
): Promise<void> {
  await requireStaffRole(['super_admin'])
  await assignDiamondToRingSetting(ringSettingId, metal, diamondId)
  revalidatePath(`/admin/ring-settings/${ringSettingId}`)
}

export async function unassignRingDiamondAction(
  ringSettingId: string,
  metal: string,
  diamondId: string,
): Promise<void> {
  await requireStaffRole(['super_admin'])
  await unassignDiamondFromRingSetting(ringSettingId, metal, diamondId)
  revalidatePath(`/admin/ring-settings/${ringSettingId}`)
}
