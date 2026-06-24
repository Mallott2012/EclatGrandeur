import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { NecklaceStoneRecord, NecklaceStoneWithSetting } from './types'
import type { CreateNecklaceStoneInput, UpdateNecklaceStoneInput } from './schemas'

const WITH_SETTING = '*, setting:necklace_settings(id, name, slug)'

export async function listNecklaceStones(): Promise<NecklaceStoneWithSetting[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_stones')
    .select(WITH_SETTING)
    .order('created_at', { ascending: false })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list necklace stones', statusHint: 500 })
  return (data ?? []) as unknown as NecklaceStoneWithSetting[]
}

export async function getNecklaceStone(id: string): Promise<NecklaceStoneWithSetting | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_stones')
    .select(WITH_SETTING)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch necklace stone', statusHint: 500 })
  return data as unknown as NecklaceStoneWithSetting | null
}

export async function createNecklaceStone(
  input: CreateNecklaceStoneInput,
  createdBy: string,
): Promise<NecklaceStoneRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_stones')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to create necklace stone', statusHint: 500 })
  return data as NecklaceStoneRecord
}

export async function updateNecklaceStone(
  id: string,
  patch: UpdateNecklaceStoneInput,
  updatedBy: string,
): Promise<NecklaceStoneRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_stones')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to update necklace stone', statusHint: 500 })
  return data as NecklaceStoneRecord
}

export async function deleteNecklaceStone(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('necklace_stones').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete necklace stone', statusHint: 500 })
}

// For the stone form's "linked setting" dropdown.
export async function listNecklaceSettingOptions(): Promise<{ id: string; name: string }[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('necklace_settings')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list necklace settings', statusHint: 500 })
  return (data ?? []) as { id: string; name: string }[]
}
