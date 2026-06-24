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
} from '@/lib/jewellery/service'
import {
  createDiamond,
  updateDiamond,
  deleteDiamond,
  listDiamonds,
} from '@/lib/diamonds/service'
import type { CreateDiamondInput, UpdateDiamondInput } from '@/lib/diamonds/schemas'

const CATEGORY = 'necklaces' as const
const BACK     = '/admin/necklaces'
const FRONT    = '/necklaces'

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
}

export async function togglePublishAction(id: string) {
  const user    = await requireStaffRole([])
  const product = await getJewelleryProduct(id)
  if (!product) throw new Error('Product not found')
  await updateJewelleryProduct(user, id, { is_published: !product.is_published })
  revalidatePath(BACK)
  revalidatePath(`${BACK}/${id}`)
  revalidatePath(FRONT)
}

export async function deleteProductAction(id: string) {
  const user = await requireStaffRole([])
  await deleteJewelleryProduct(user, id)
  revalidatePath(BACK)
  revalidatePath(FRONT)
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
