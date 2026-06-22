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
