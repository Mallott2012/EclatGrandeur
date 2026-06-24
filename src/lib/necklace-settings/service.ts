import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { NecklaceSettingRecord, NecklaceSettingFull } from './types'
import type { CreateNecklaceSettingInput, UpdateNecklaceSettingInput } from './schemas'

export async function listNecklaceSettings(): Promise<NecklaceSettingRecord[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_settings')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list necklace settings', statusHint: 500 })
  return (data ?? []) as NecklaceSettingRecord[]
}

export async function getNecklaceSetting(id: string): Promise<NecklaceSettingFull | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_settings')
    .select('*, media:necklace_media(*)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch necklace setting', statusHint: 500 })
  return data as NecklaceSettingFull | null
}

export async function createNecklaceSetting(
  input: CreateNecklaceSettingInput,
  createdBy: string,
): Promise<NecklaceSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_settings')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A necklace setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to create necklace setting', statusHint: 500 })
  }
  return data as NecklaceSettingRecord
}

export async function updateNecklaceSetting(
  id: string,
  patch: UpdateNecklaceSettingInput,
  updatedBy: string,
): Promise<NecklaceSettingRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_settings')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ServiceException({ code: 'duplicate_slug', message: 'A necklace setting with this slug already exists', statusHint: 409 })
    }
    throw new ServiceException({ code: 'db_error', message: 'Failed to update necklace setting', statusHint: 500 })
  }
  return data as NecklaceSettingRecord
}

export async function deleteNecklaceSetting(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('necklace_settings').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete necklace setting', statusHint: 500 })
}
