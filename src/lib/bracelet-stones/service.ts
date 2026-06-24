import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { BraceletStoneRecord, BraceletStoneWithSetting } from './types'
import type { CreateBraceletStoneInput, UpdateBraceletStoneInput } from './schemas'

const WITH_SETTING = '*, setting:bracelet_settings(id, name, slug)'

export async function listBraceletStones(): Promise<BraceletStoneWithSetting[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_stones')
    .select(WITH_SETTING)
    .order('created_at', { ascending: false })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list bracelet stones', statusHint: 500 })
  return (data ?? []) as unknown as BraceletStoneWithSetting[]
}

export async function getBraceletStone(id: string): Promise<BraceletStoneWithSetting | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_stones')
    .select(WITH_SETTING)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch bracelet stone', statusHint: 500 })
  return data as unknown as BraceletStoneWithSetting | null
}

export async function createBraceletStone(
  input: CreateBraceletStoneInput,
  createdBy: string,
): Promise<BraceletStoneRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_stones')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to create bracelet stone', statusHint: 500 })
  return data as BraceletStoneRecord
}

export async function updateBraceletStone(
  id: string,
  patch: UpdateBraceletStoneInput,
  updatedBy: string,
): Promise<BraceletStoneRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_stones')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to update bracelet stone', statusHint: 500 })
  return data as BraceletStoneRecord
}

export async function deleteBraceletStone(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('bracelet_stones').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete bracelet stone', statusHint: 500 })
}

// For the stone form's "linked setting" dropdown.
export async function listBraceletSettingOptions(): Promise<{ id: string; name: string }[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('bracelet_settings')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list bracelet settings', statusHint: 500 })
  return (data ?? []) as { id: string; name: string }[]
}
