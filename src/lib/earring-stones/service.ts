import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { EarringStoneRecord, EarringStoneWithSetting } from './types'
import type { CreateEarringStoneInput, UpdateEarringStoneInput } from './schemas'

const WITH_SETTING = '*, setting:earring_settings(id, name, slug)'

export async function listEarringStones(): Promise<EarringStoneWithSetting[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_stones')
    .select(WITH_SETTING)
    .order('created_at', { ascending: false })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list earring stones', statusHint: 500 })
  return (data ?? []) as unknown as EarringStoneWithSetting[]
}

export async function getEarringStone(id: string): Promise<EarringStoneWithSetting | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_stones')
    .select(WITH_SETTING)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch earring stone', statusHint: 500 })
  return data as unknown as EarringStoneWithSetting | null
}

export async function createEarringStone(
  input: CreateEarringStoneInput,
  createdBy: string,
): Promise<EarringStoneRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_stones')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to create earring stone', statusHint: 500 })
  return data as EarringStoneRecord
}

export async function updateEarringStone(
  id: string,
  patch: UpdateEarringStoneInput,
  updatedBy: string,
): Promise<EarringStoneRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_stones')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to update earring stone', statusHint: 500 })
  return data as EarringStoneRecord
}

export async function deleteEarringStone(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('earring_stones').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete earring stone', statusHint: 500 })
}

// For the stone form's "linked setting" dropdown.
export async function listEarringSettingOptions(): Promise<{ id: string; name: string }[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('earring_settings')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list earring settings', statusHint: 500 })
  return (data ?? []) as { id: string; name: string }[]
}
