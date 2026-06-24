'use server'

import { revalidatePath } from 'next/cache'
import { requireStaffRole } from '@/lib/staff'
import {
  updateRingSetting,
  deleteRingSetting,
  getRingSetting,
  assignDiamondToRingSetting,
  unassignDiamondFromRingSetting,
  getRingSettingDiamonds,
} from '@/lib/ring-settings/service'
import {
  createDiamond,
  updateDiamond,
  deleteDiamond,
  listDiamonds,
} from '@/lib/diamonds/service'
import type { CreateDiamondInput, UpdateDiamondInput } from '@/lib/diamonds/schemas'

export async function updateRingAction(id: string, patch: Record<string, unknown>) {
  const user = await requireStaffRole([])
  const dbPatch: Record<string, unknown> = {}
  if (patch.name        !== undefined) dbPatch.name           = patch.name
  if (patch.subtitle    !== undefined) dbPatch.collection     = patch.subtitle
  if (patch.description !== undefined) dbPatch.description    = patch.description
  if (patch.basePrice   !== undefined) dbPatch.base_price_gbp = patch.basePrice
  if (patch.metals      !== undefined) dbPatch.metals         = patch.metals
  if (patch.published   !== undefined) dbPatch.is_published   = patch.published
  // images stored as media rows — not patched here directly
  await updateRingSetting(id, dbPatch as Parameters<typeof updateRingSetting>[1], user.id)
  revalidatePath('/admin/rings')
  revalidatePath(`/admin/rings/${id}`)
  revalidatePath('/engagement-rings')
}

export async function toggleRingPublishAction(id: string) {
  const user = await requireStaffRole([])
  const ring = await getRingSetting(id)
  if (!ring) throw new Error('Ring not found')
  await updateRingSetting(id, { is_published: !ring.is_published }, user.id)
  revalidatePath('/admin/rings')
  revalidatePath(`/admin/rings/${id}`)
  revalidatePath('/engagement-rings')
}

export async function deleteRingAction(id: string) {
  await requireStaffRole([])
  await deleteRingSetting(id)
  revalidatePath('/admin/rings')
  revalidatePath('/engagement-rings')
}

/** Assign a diamond to this ring for ALL metals (simplified) */
export async function assignRingDiamondAction(ringId: string, diamondId: string) {
  await requireStaffRole([])
  // Assign for all metals that exist on the ring
  const ring = await getRingSetting(ringId)
  const metals = ring?.metals ?? ['platinum']
  for (const metal of metals) {
    await assignDiamondToRingSetting(ringId, metal, diamondId)
  }
  revalidatePath(`/admin/rings/${ringId}`)
}

export async function unassignRingDiamondAction(ringId: string, diamondId: string) {
  await requireStaffRole([])
  const ring = await getRingSetting(ringId)
  const metals = ring?.metals ?? ['platinum']
  for (const metal of metals) {
    await unassignDiamondFromRingSetting(ringId, metal, diamondId)
  }
  revalidatePath(`/admin/rings/${ringId}`)
}

export { getRingSettingDiamonds }

// ── Diamond CRUD (inline, no separate page needed) ────────────────────────────

export async function createDiamondAction(data: CreateDiamondInput) {
  const user = await requireStaffRole([])
  const diamond = await createDiamond(user, data)
  revalidatePath('/admin/rings')
  return diamond
}

export async function updateDiamondAction(id: string, data: UpdateDiamondInput) {
  const user = await requireStaffRole([])
  await updateDiamond(user, id, data)
  revalidatePath('/admin/rings')
}

export async function deleteDiamondAction(id: string) {
  const user = await requireStaffRole([])
  await deleteDiamond(user, id)
  revalidatePath('/admin/rings')
}

export { listDiamonds }
