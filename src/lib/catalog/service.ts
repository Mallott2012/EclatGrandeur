import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffUser } from '@/lib/staff-shared'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StyleCategory =
  | 'engagement-rings'
  | 'necklaces'
  | 'earrings'
  | 'bracelets'

export interface CatalogStyle {
  id:         string
  category:   StyleCategory
  slug:       string
  label:      string
  image_url:  string | null
  sort_order: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface StyleInput {
  category:   StyleCategory
  slug:       string
  label:      string
  image_url?: string | null
  sort_order?: number
  is_visible?: boolean
}

// ── Reads ───────────────────────────────────────────────────────────────────

/** Visible styles for a category — used by the public storefront scroller. */
export async function listVisibleStyles(category: StyleCategory): Promise<CatalogStyle[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('catalog_styles')
    .select('*')
    .eq('category', category)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
  if (error) return []
  return (data ?? []) as CatalogStyle[]
}

/** All styles (visible + hidden) for a category — used by the admin editor. */
export async function listAllStyles(category: StyleCategory): Promise<CatalogStyle[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('catalog_styles')
    .select('*')
    .eq('category', category)
    .order('sort_order', { ascending: true })
  if (error) throw new Error('Failed to list catalog styles')
  return (data ?? []) as CatalogStyle[]
}

export async function getStyle(id: string): Promise<CatalogStyle | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('catalog_styles')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) return null
  return data as CatalogStyle | null
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function createStyle(actor: StaffUser, input: StyleInput): Promise<CatalogStyle> {
  const admin = createAdminClient()

  // Default sort_order to the end of the list when not supplied.
  let sortOrder = input.sort_order
  if (sortOrder == null) {
    const { data: last } = await admin
      .from('catalog_styles')
      .select('sort_order')
      .eq('category', input.category)
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    sortOrder = (last?.sort_order ?? -1) + 1
  }

  const { data, error } = await admin
    .from('catalog_styles')
    .insert({
      category:   input.category,
      slug:       input.slug,
      label:      input.label,
      image_url:  input.image_url ?? null,
      sort_order: sortOrder,
      is_visible: input.is_visible ?? true,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create style')
  return data as CatalogStyle
}

export async function updateStyle(
  actor: StaffUser,
  id:    string,
  patch: Partial<StyleInput>,
): Promise<CatalogStyle> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('catalog_styles')
    .update({ ...patch, updated_by: actor.id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to update style')
  return data as CatalogStyle
}

export async function deleteStyle(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('catalog_styles').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/** Persist a new ordering for a category (array of style ids in display order). */
export async function reorderStyles(
  actor:    StaffUser,
  category: StyleCategory,
  orderedIds: string[],
): Promise<void> {
  const admin = createAdminClient()
  await Promise.all(
    orderedIds.map((id, index) =>
      admin
        .from('catalog_styles')
        .update({ sort_order: index, updated_by: actor.id })
        .eq('id', id)
        .eq('category', category),
    ),
  )
}
