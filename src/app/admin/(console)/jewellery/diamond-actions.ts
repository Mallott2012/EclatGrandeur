'use server'

import { revalidatePath } from 'next/cache'
import { requireStaffRole } from '@/lib/staff'
import {
  assignDiamondToJewellery,
  unassignDiamondFromJewellery,
} from '@/lib/jewellery/service'

export async function assignJewelleryDiamondAction(
  jewelleryId: string,
  diamondId: string,
): Promise<void> {
  await requireStaffRole(['super_admin', 'content_editor'])
  await assignDiamondToJewellery(jewelleryId, diamondId)
  revalidatePath(`/admin/jewellery/${jewelleryId}`)
}

export async function unassignJewelleryDiamondAction(
  jewelleryId: string,
  diamondId: string,
): Promise<void> {
  await requireStaffRole(['super_admin', 'content_editor'])
  await unassignDiamondFromJewellery(jewelleryId, diamondId)
  revalidatePath(`/admin/jewellery/${jewelleryId}`)
}
