import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { RingSettingRecord, RingSettingFull } from './types'
import type { CreateRingSettingInput, UpdateRingSettingInput } from './schemas'

// ── Queries ──────────────────────────────────────────────────────────────────

export async function listRingSettings(): Promise<RingSettingFull[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .select('*, media:ring_setting_media(*)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list ring settings', statusHint: 500 })
  return (data ?? []) as RingSettingFull[]
}

export async function getRingSetting(id: string): Promise<RingSettingFull | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .select('*, media:ring_setting_media(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch ring setting', statusHint: 500 })
  return data as RingSettingFull | null
}

export async function getRingSettingBySlug(slug: string): Promise<RingSettingFull | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .select('*, media:ring_setting_media(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch ring setting', statusHint: 500 })
  return data as RingSettingFull | null
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createRingSetting(
  input: CreateRingSettingInput,
  createdBy: string,
): Promise<RingSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A ring setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to create ring setting', statusHint: 500 })
  }
  return data as RingSettingRecord
}

export async function updateRingSetting(
  id: string,
  patch: UpdateRingSettingInput,
  updatedBy: string,
): Promise<RingSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .update({ ...patch, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A ring setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to update ring setting', statusHint: 500 })
  }
  return data as RingSettingRecord
}

export async function deleteRingSetting(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('ring_settings').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete ring setting', statusHint: 500 })
}

export async function toggleRingSettingPublished(
  id: string,
  is_published: boolean,
  updatedBy: string,
): Promise<RingSettingRecord> {
  return updateRingSetting(id, { is_published }, updatedBy)
}

// ── Diamond assignments ───────────────────────────────────────────────────────

export interface RingSettingDiamondRow {
  id:               string
  ring_setting_id:  string
  metal:            string
  diamond_id:       string
  created_at:       string
}

/** Returns all diamond IDs assigned to a ring setting, keyed by metal */
export async function getRingSettingDiamonds(
  ringSettingId: string,
): Promise<Record<string, string[]>> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_setting_diamonds')
    .select('metal, diamond_id')
    .eq('ring_setting_id', ringSettingId)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch ring setting diamonds', statusHint: 500 })
  const result: Record<string, string[]> = {}
  for (const row of data ?? []) {
    if (!result[row.metal]) result[row.metal] = []
    result[row.metal].push(row.diamond_id)
  }
  return result
}

/** Assign a diamond to a ring setting + metal combo */
export async function assignDiamondToRingSetting(
  ringSettingId: string,
  metal:         string,
  diamondId:     string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ring_setting_diamonds')
    .insert({ ring_setting_id: ringSettingId, metal, diamond_id: diamondId })
  // Ignore duplicate (already assigned)
  if (error && error.code !== '23505') {
    throw new ServiceException({ code: 'db_error', message: 'Failed to assign diamond', statusHint: 500 })
  }
}

// ── Media rows ────────────────────────────────────────────────────────────────

export async function addRingSettingMedia(
  ringId:       string,
  storageUrl:   string,
  displayOrder: number,
): Promise<{ id: string; url: string; isPrimary: boolean }> {
  const mediaType = storageUrl.toLowerCase().endsWith('.mp4') ? 'video_360' : 'image'
  const isPrimary = displayOrder === 0
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_setting_media')
    .insert({
      ring_setting_id: ringId,
      storage_path:    storageUrl,
      display_order:   displayOrder,
      media_type:      mediaType,
      is_primary:      isPrimary,
    })
    .select('id')
    .single()
  if (error) throw new ServiceException({ code: 'db_error', message: `Failed to add media: ${error.message}`, statusHint: 500 })
  return { id: data.id, url: storageUrl, isPrimary }
}

export async function reorderRingSettingMedia(ringId: string, orderedIds: string[]): Promise<void> {
  const admin = createAdminClient()
  await Promise.all(
    orderedIds.map((mediaId, i) =>
      admin.from('ring_setting_media').update({ display_order: i }).eq('id', mediaId).eq('ring_setting_id', ringId)
    )
  )
}

export async function setRingSettingMediaPrimary(ringId: string, mediaId: string): Promise<void> {
  const admin = createAdminClient()
  const { error: e1 } = await admin.from('ring_setting_media').update({ is_primary: false }).eq('ring_setting_id', ringId)
  if (e1) throw new ServiceException({ code: 'db_error', message: 'Failed to clear primary', statusHint: 500 })
  const { error: e2 } = await admin.from('ring_setting_media').update({ is_primary: true }).eq('id', mediaId)
  if (e2) throw new ServiceException({ code: 'db_error', message: 'Failed to set primary', statusHint: 500 })
}

export async function setRingSettingMediaMetal(
  ringId:  string,
  mediaId: string,
  metal:   string | null,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ring_setting_media')
    .update({ metal })
    .eq('id', mediaId)
    .eq('ring_setting_id', ringId)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to set media metal', statusHint: 500 })
}

export async function deleteRingSettingMedia(
  ringId:     string,
  storageUrl: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ring_setting_media')
    .delete()
    .eq('ring_setting_id', ringId)
    .eq('storage_path', storageUrl)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete media', statusHint: 500 })
}

export async function setRingSettingGallery(id: string, galleryConfig: unknown): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ring_settings')
    .update({ gallery_config: galleryConfig })
    .eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to save gallery config', statusHint: 500 })
}

export async function setRingSettingMetalVariants(id: string, metalVariants: unknown): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ring_settings')
    .update({ metal_variants: metalVariants })
    .eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to save metal variants', statusHint: 500 })
}

export async function setRingSettingDiamondShapes(id: string, diamond_shapes: string[]): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ring_settings')
    .update({ diamond_shapes })
    .eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to save diamond shapes', statusHint: 500 })
}

export interface RingEngagementConfigPatch {
  min_carat?:                   number | null
  max_carat?:                   number | null
  ring_sizes?:                  string[]
  requires_diamond_selection?:   boolean
  requires_ring_size_selection?: boolean
  setting_style?:               string | null
  band_style?:                  string | null
  head_style?:                  string | null
}

export async function setRingSettingEngagementConfig(
  id:     string,
  config: RingEngagementConfigPatch,
): Promise<void> {
  const admin = createAdminClient()
  const patch: Record<string, unknown> = {}
  if ('min_carat'                   in config) patch.min_carat                    = config.min_carat
  if ('max_carat'                   in config) patch.max_carat                    = config.max_carat
  if ('ring_sizes'                  in config) patch.ring_sizes                   = config.ring_sizes
  if ('requires_diamond_selection'  in config) patch.requires_diamond_selection   = config.requires_diamond_selection
  if ('requires_ring_size_selection' in config) patch.requires_ring_size_selection = config.requires_ring_size_selection
  if ('setting_style'               in config) patch.setting_style                = config.setting_style
  if ('band_style'                  in config) patch.band_style                   = config.band_style
  if ('head_style'                  in config) patch.head_style                   = config.head_style
  if (Object.keys(patch).length === 0) return
  const { error } = await admin.from('ring_settings').update(patch).eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to save engagement config', statusHint: 500 })
}

/** Remove a diamond from a ring setting + metal combo */
export async function unassignDiamondFromRingSetting(
  ringSettingId: string,
  metal:         string,
  diamondId:     string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('ring_setting_diamonds')
    .delete()
    .eq('ring_setting_id', ringSettingId)
    .eq('metal', metal)
    .eq('diamond_id', diamondId)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to unassign diamond', statusHint: 500 })
}
