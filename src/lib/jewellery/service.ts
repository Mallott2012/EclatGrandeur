import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffUser } from '@/lib/staff-shared'
import {
  parseJewelleryProduct,
  type JewelleryProduct,
  type JewelleryProductRecord,
  type JewelleryProductMediaRecord,
  type JewelleryCategory,
} from './types'
import type { CreateJewelleryProductInput, UpdateJewelleryProductInput } from './schemas'

// ── Audit helper ──────────────────────────────────────────────────────────────

async function writeAudit(
  actorId:    string,
  action:     string,
  entityType: string,
  entityId:   string,
  metadata?:  Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_user_id: actorId,
      action,
      entity_type:   entityType,
      entity_id:     entityId,
      metadata:      metadata ?? {},
    })
  } catch {
    // Non-blocking
  }
}

// ── Jewellery products ────────────────────────────────────────────────────────

export async function listJewelleryProducts(
  category?: JewelleryCategory,
): Promise<JewelleryProduct[]> {
  const admin = createAdminClient()
  let query = admin
    .from('jewellery_products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) throw new Error('Failed to list jewellery products')
  return ((data ?? []) as JewelleryProductRecord[]).map((r) => parseJewelleryProduct(r))
}

export async function listPublishedJewelleryProducts(
  category: JewelleryCategory,
): Promise<JewelleryProduct[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('jewellery_products')
    .select('*')
    .eq('category', category)
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
  if (error) throw new Error('Failed to list published jewellery products')
  const records = (data ?? []) as JewelleryProductRecord[]

  // Fetch primary media for each product in one query
  if (records.length === 0) return []
  const ids = records.map((r) => r.id)
  const { data: mediaData } = await admin
    .from('jewellery_product_media')
    .select('*')
    .in('jewellery_product_id', ids)
    .order('display_order', { ascending: true })
  const mediaByProduct = ((mediaData ?? []) as JewelleryProductMediaRecord[])
    .reduce<Record<string, JewelleryProductMediaRecord[]>>((acc, m) => {
      if (!acc[m.jewellery_product_id]) acc[m.jewellery_product_id] = []
      acc[m.jewellery_product_id].push(m)
      return acc
    }, {})
  return records.map((r) => parseJewelleryProduct(r, mediaByProduct[r.id] ?? []))
}

export async function getJewelleryProductBySlug(
  slug:     string,
  category: JewelleryCategory,
): Promise<JewelleryProduct | null> {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('jewellery_products')
    .select('*')
    .eq('slug', slug)
    .eq('category', category)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw new Error('Failed to fetch jewellery product')
  if (!row) return null

  const { data: mediaData } = await admin
    .from('jewellery_product_media')
    .select('*')
    .eq('jewellery_product_id', (row as JewelleryProductRecord).id)
    .order('display_order', { ascending: true })
  return parseJewelleryProduct(row as JewelleryProductRecord, (mediaData ?? []) as JewelleryProductMediaRecord[])
}

export async function getJewelleryProduct(id: string): Promise<JewelleryProduct | null> {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('jewellery_products')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Failed to fetch jewellery product')
  if (!row) return null
  const { data: mediaData } = await admin
    .from('jewellery_product_media')
    .select('*')
    .eq('jewellery_product_id', id)
    .order('display_order', { ascending: true })
  return parseJewelleryProduct(row as JewelleryProductRecord, (mediaData ?? []) as JewelleryProductMediaRecord[])
}

export async function createJewelleryProduct(
  actor: StaffUser,
  input: CreateJewelleryProductInput,
): Promise<JewelleryProduct> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('jewellery_products')
    .insert({ ...input, created_by: actor.id, updated_by: actor.id })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create jewellery product')
  await writeAudit(actor.id, 'jewellery.create', 'jewellery_product', data.id, { name: input.name })
  return parseJewelleryProduct(data as JewelleryProductRecord)
}

export async function setEarringType(id: string, earringType: string | null): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('jewellery_products')
    .update({ earring_type: earringType })
    .eq('id', id)
  if (error) throw new Error(`setEarringType: ${error.message}`)
}

export async function setJewelleryGallery(id: string, galleryConfig: unknown): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('jewellery_products')
    .update({ gallery_config: galleryConfig })
    .eq('id', id)
  if (error) throw new Error('Failed to save gallery config')
}

export async function setJewelleryMetalVariants(id: string, metalVariants: unknown): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('jewellery_products')
    .update({ metal_variants: metalVariants })
    .eq('id', id)
  if (error) throw new Error('Failed to save metal variants')
}

export async function updateJewelleryProduct(
  actor: StaffUser,
  id:    string,
  patch: UpdateJewelleryProductInput,
): Promise<JewelleryProduct> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('jewellery_products')
    .update({ ...patch, updated_by: actor.id })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to update jewellery product')
  await writeAudit(actor.id, 'jewellery.update', 'jewellery_product', id)
  return parseJewelleryProduct(data as JewelleryProductRecord)
}

export async function deleteJewelleryProduct(actor: StaffUser, id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('jewellery_products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await writeAudit(actor.id, 'jewellery.delete', 'jewellery_product', id)
}

// ── Media rows ────────────────────────────────────────────────────────────────

export async function addJewelleryProductMedia(
  productId:    string,
  storageUrl:   string,
  displayOrder: number,
): Promise<{ id: string; url: string; isPrimary: boolean }> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('jewellery_product_media')
    .insert({ jewellery_product_id: productId, storage_path: storageUrl, display_order: displayOrder })
    .select('id')
    .single()
  if (error) throw new Error('Failed to add media: ' + error.message)
  return { id: data.id, url: storageUrl, isPrimary: displayOrder === 0 }
}

export async function reorderJewelleryProductMedia(productId: string, orderedIds: string[]): Promise<void> {
  const admin = createAdminClient()
  await Promise.all(
    orderedIds.map((mediaId, i) =>
      admin.from('jewellery_product_media').update({ display_order: i }).eq('id', mediaId).eq('jewellery_product_id', productId)
    )
  )
}

export async function setJewelleryMediaMetal(
  productId: string,
  mediaId:   string,
  metal:     string | null,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('jewellery_product_media')
    .update({ metal })
    .eq('id', mediaId)
    .eq('jewellery_product_id', productId)
  if (error) throw new Error('Failed to set media metal: ' + error.message)
}

export async function deleteJewelleryProductMedia(
  productId:  string,
  storageUrl: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('jewellery_product_media')
    .delete()
    .eq('jewellery_product_id', productId)
    .eq('storage_path', storageUrl)
  if (error) throw new Error('Failed to delete media: ' + error.message)
}

// ── Diamond assignments ───────────────────────────────────────────────────────

/** Returns all diamond IDs assigned to a jewellery product */
export async function getJewelleryDiamonds(jewelleryId: string): Promise<string[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('jewellery_diamonds')
    .select('diamond_id')
    .eq('jewellery_id', jewelleryId)
  if (error) throw new Error('Failed to fetch jewellery diamonds')
  return (data ?? []).map((r: { diamond_id: string }) => r.diamond_id)
}

/** Assign a diamond to a jewellery product */
export async function assignDiamondToJewellery(
  jewelleryId: string,
  diamondId:   string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('jewellery_diamonds')
    .insert({ jewellery_id: jewelleryId, diamond_id: diamondId })
  if (error && error.code !== '23505') throw new Error('Failed to assign diamond')
}

/** Remove a diamond from a jewellery product */
export async function unassignDiamondFromJewellery(
  jewelleryId: string,
  diamondId:   string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('jewellery_diamonds')
    .delete()
    .eq('jewellery_id', jewelleryId)
    .eq('diamond_id', diamondId)
  if (error) throw new Error('Failed to unassign diamond')
}
