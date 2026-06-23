import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { RingSettingRecord, RingSettingFull } from './types'
import type { CreateRingSettingInput, UpdateRingSettingInput } from './schemas'

// ── Queries ──────────────────────────────────────────────────────────────────

export async function listRingSettings(): Promise<RingSettingRecord[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list ring settings', statusHint: 500 })
  return (data ?? []) as RingSettingRecord[]
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
