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
  createOffer,
  updateOffer,
  deleteOffer,
  duplicateOffer,
} from '@/lib/earrings/offers'
import type { CreateDiamondInput, UpdateDiamondInput } from '@/lib/diamonds/schemas'
import type { CreateEarringOfferInput, UpdateEarringOfferInput } from '@/lib/earrings/offer-types'
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

// ── Earring Diamond Offer actions ─────────────────────────────────────────────

export async function createOfferAction(input: CreateEarringOfferInput): Promise<{ error?: string }> {
  await requireStaffRole([])
  const res = await createOffer(input)
  if (!res.ok) return { error: res.error }
  revalidatePath(`${BACK}/${input.jewellery_product_id}`)
  revalidatePath(FRONT)
  revalidatePath(FRONT_SLUG, 'page')
  return {}
}

export async function updateOfferAction(offerId: string, patch: UpdateEarringOfferInput, productId: string): Promise<{ error?: string }> {
  await requireStaffRole([])
  const res = await updateOffer(offerId, patch)
  if (!res.ok) return { error: res.error }
  revalidatePath(`${BACK}/${productId}`)
  revalidatePath(FRONT)
  revalidatePath(FRONT_SLUG, 'page')
  return {}
}

export async function deleteOfferAction(offerId: string, productId: string): Promise<void> {
  await requireStaffRole([])
  await deleteOffer(offerId)
  revalidatePath(`${BACK}/${productId}`)
  revalidatePath(FRONT)
  revalidatePath(FRONT_SLUG, 'page')
}

export async function duplicateOfferAction(offerId: string, productId: string): Promise<{ error?: string }> {
  await requireStaffRole([])
  const res = await duplicateOffer(offerId)
  if (!res.ok) return { error: res.error }
  revalidatePath(`${BACK}/${productId}`)
  return {}
}
