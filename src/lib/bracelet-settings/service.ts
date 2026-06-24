import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { BraceletSettingRecord, BraceletSettingFull } from './types'
import type { CreateBraceletSettingInput, UpdateBraceletSettingInput } from './schemas'

export async function listBraceletSettings(): Promise<BraceletSettingRecord[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_settings')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list bracelet settings', statusHint: 500 })
  return (data ?? []) as BraceletSettingRecord[]
}

export async function getBraceletSetting(id: string): Promise<BraceletSettingFull | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_settings')
    .select('*, media:bracelet_media(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch bracelet setting', statusHint: 500 })
  return data as BraceletSettingFull | null
}

export async function createBraceletSetting(
  input: CreateBraceletSettingInput,
  createdBy: string,
): Promise<BraceletSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_settings')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A bracelet setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to create bracelet setting', statusHint: 500 })
  }
  return data as BraceletSettingRecord
}

export async function updateBraceletSetting(
  id: string,
  patch: UpdateBraceletSettingInput,
  updatedBy: string,
): Promise<BraceletSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_settings')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A bracelet setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to update bracelet setting', statusHint: 500 })
  }
  return data as BraceletSettingRecord
}

export async function deleteBraceletSetting(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('bracelet_settings').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete bracelet setting', statusHint: 500 })
}
