'use server'

import { revalidatePath } from 'next/cache'
import { requireStaffRole } from '@/lib/staff'
import {
  updateJewelleryProduct,
  deleteJewelleryProduct,
  getJewelleryProduct,
  assignDiamondToJewellery,
  unassignDiamondFromJewellery,
  getJewelleryDiamonds,
  setEarringType,
} from '@/lib/jewellery/service'
import {
  createDiamond,
  updateDiamond,
  deleteDiamond,
  listDiamonds,
} from '@/lib/diamonds/service'
import {
  createStoneSlot,
  updateStoneSlot,
  deleteStoneSlot,
} from '@/lib/pairs/service'
import type { CreateDiamondInput, UpdateDiamondInput } from '@/lib/diamonds/schemas'
import type { CreateSlotInput, UpdateSlotInput } from '@/lib/pairs/types'
import type { EarringType } from '@/lib/jewellery/types'

const CATEGORY   = 'earrings' as const
const BACK       = '/admin/earrings'
const FRONT      = '/earrings'
const FRONT_SLUG = '/earrings/[slug]'

export async function updateProductAction(id: string, patch: Record<string, unknown>) {
  const user = await requireStaffRole([])
  const dbPatch: Record<string, unknown> = {}
  if (patch.name        !== undefined) dbPatch.name           = patch.name
  if (patch.subtitle    !== undefined) dbPatch.subtitle       = patch.subtitle
  if (patch.description !== undefined) dbPatch.description    = patch.description
  if (patch.basePrice   !== undefined) dbPatch.base_price_gbp = patch.basePrice
  if (patch.metals      !== undefined) dbPatch.metals         = patch.metals
  if (patch.published   !== undefined) dbPatch.is_published   = patch.published
  await updateJewelleryProduct(user, id, dbPatch as Parameters<typeof updateJewelleryProduct>[2])
  revalidatePath(BACK)
  revalidatePath(`${BACK}/${id}`)
  revalidatePath(FRONT)
  revalidatePath(FRONT_SLUG, 'page')
}

export async function togglePublishAction(id: string) {
  const user    = await requireStaffRole([])
  const product = await getJewelleryProduct(id)
  if (!product) throw new Error('Product not found')
  await updateJewelleryProduct(user, id, { is_published: !product.is_published })
  revalidatePath(BACK)
  revalidatePath(`${BACK}/${id}`)
  revalidatePath(FRONT)
  revalidatePath(FRONT_SLUG, 'page')
}

export async function deleteProductAction(id: string) {
  const user = await requireStaffRole([])
  await deleteJewelleryProduct(user, id)
  revalidatePath(BACK)
  revalidatePath(FRONT)
  revalidatePath(FRONT_SLUG, 'page')
}

export async function assignDiamondAction(productId: string, diamondId: string) {
  await requireStaffRole([])
  await assignDiamondToJewellery(productId, diamondId)
  revalidatePath(`${BACK}/${productId}`)
}

export async function unassignDiamondAction(productId: string, diamondId: string) {
  await requireStaffRole([])
  await unassignDiamondFromJewellery(productId, diamondId)
  revalidatePath(`${BACK}/${productId}`)
}

export { getJewelleryDiamonds }

export async function createDiamondAction(data: CreateDiamondInput) {
  const user = await requireStaffRole([])
  return await createDiamond(user, data)
}

export async function updateDiamondAction(id: string, data: UpdateDiamondInput) {
  const user = await requireStaffRole([])
  await updateDiamond(user, id, data)
}

export async function deleteDiamondAction(id: string) {
  const user = await requireStaffRole([])
  await deleteDiamond(user, id)
}

export { listDiamonds }

// ── Earring configuration actions ─────────────────────────────────────────────

export async function saveEarringTypeAction(productId: string, type: EarringType | null): Promise<void> {
  await requireStaffRole([])
  await setEarringType(productId, type)
  revalidatePath(`${BACK}/${productId}`)
}

export async function createSlotAction(input: CreateSlotInput): Promise<{ error?: string }> {
  await requireStaffRole([])
  try {
    await createStoneSlot(input)
    revalidatePath(`${BACK}/${input.jewellery_product_id}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateSlotAction(slotId: string, patch: UpdateSlotInput, productId: string): Promise<{ error?: string }> {
  await requireStaffRole([])
  try {
    await updateStoneSlot(slotId, patch)
    revalidatePath(`${BACK}/${productId}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteSlotAction(slotId: string, productId: string): Promise<void> {
  await requireStaffRole([])
  await deleteStoneSlot(slotId)
  revalidatePath(`${BACK}/${productId}`)
}
