import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { EarringSettingRecord, EarringSettingFull } from './types'
import type { CreateEarringSettingInput, UpdateEarringSettingInput } from './schemas'

export async function listEarringSettings(): Promise<EarringSettingRecord[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_settings')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list earring settings', statusHint: 500 })
  return (data ?? []) as EarringSettingRecord[]
}

export async function getEarringSetting(id: string): Promise<EarringSettingFull | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_settings')
    .select('*, media:earring_media(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch earring setting', statusHint: 500 })
  return data as EarringSettingFull | null
}

export async function createEarringSetting(
  input: CreateEarringSettingInput,
  createdBy: string,
): Promise<EarringSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_settings')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A earring setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to create earring setting', statusHint: 500 })
  }
  return data as EarringSettingRecord
}

export async function updateEarringSetting(
  id: string,
  patch: UpdateEarringSettingInput,
  updatedBy: string,
): Promise<EarringSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_settings')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A earring setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to update earring setting', statusHint: 500 })
  }
  return data as EarringSettingRecord
}

export async function deleteEarringSetting(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('earring_settings').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete earring setting', statusHint: 500 })
}
