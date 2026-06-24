import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import type { StaffUser } from '@/lib/staff-shared'
import {
  parseDiamond,
  parseRingSetting,
  type Diamond,
  type RingSetting,
  type DiamondRecord,
  type DiamondMediaRecord,
  type RingSettingRecord,
  type RingSettingMediaRecord,
} from './types'
import type {
  CreateDiamondInput,
  UpdateDiamondInput,
  CreateRingSettingInput,
  UpdateRingSettingInput,
} from './schemas'

// ── Audit helper ──────────────────────────────────────────────────────────────

async function writeAudit(
  actorId:  string,
  action:   string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('audit_logs').insert({
      actor_user_id: actorId,
      action,
      entity_type:   entityType,
      entity_id:     entityId,
      metadata:      metadata ?? {},
    })
  } catch {
    // Non-blocking — never throw on audit failure
  }
}

// ── Diamonds ──────────────────────────────────────────────────────────────────

export async function listDiamonds(): Promise<Diamond[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamonds')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error('Failed to list diamonds')
  const records = (data ?? []) as DiamondRecord[]
  return records.map((r) => parseDiamond(r))
}

export async function getDiamond(id: string): Promise<Diamond | null> {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('diamonds')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Failed to fetch diamond')
  if (!row) return null
  const media = await listDiamondMedia(id)
  return parseDiamond(row as DiamondRecord, media)
}

export async function createDiamond(
  actor: StaffUser,
  input: CreateDiamondInput,
): Promise<Diamond> {
  const admin = createAdminClient()
  // Insert with empty sku — trigger will auto-assign EGD-YYYY-NNNNNN
  const { data, error } = await admin
    .from('diamonds')
    .insert({ ...input, sku: '', created_by: actor.id, updated_by: actor.id })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create diamond')
  const diamond = parseDiamond(data as DiamondRecord)
  await writeAudit(actor.id, 'diamond.create', 'diamond', diamond.id, { sku: diamond.sku })
  return diamond
}

export async function updateDiamond(
  actor: StaffUser,
  id:    string,
  patch: UpdateDiamondInput,
): Promise<Diamond> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamonds')
    .update({ ...patch, updated_by: actor.id })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to update diamond')
  await writeAudit(actor.id, 'diamond.update', 'diamond', id)
  return parseDiamond(data as DiamondRecord)
}

export async function deleteDiamond(actor: StaffUser, id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('diamonds').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await writeAudit(actor.id, 'diamond.delete', 'diamond', id)
}

// ── Diamond media ─────────────────────────────────────────────────────────────

export async function listDiamondMedia(diamondId: string): Promise<DiamondMediaRecord[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamond_media')
    .select('*')
    .eq('diamond_id', diamondId)
    .order('display_order', { ascending: true })
  if (error) throw new Error('Failed to fetch diamond media')
  return (data ?? []) as DiamondMediaRecord[]
}

export async function addDiamondMedia(
  actor: StaffUser,
  record: Omit<DiamondMediaRecord, 'id' | 'created_at'>,
): Promise<DiamondMediaRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamond_media')
    .insert(record)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to add media')
  await writeAudit(actor.id, 'diamond.media.add', 'diamond', record.diamond_id)
  return data as DiamondMediaRecord
}

export async function deleteDiamondMedia(actor: StaffUser, mediaId: string, diamondId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('diamond_media').delete().eq('id', mediaId).eq('diamond_id', diamondId)
  if (error) throw new Error(error.message)
  await writeAudit(actor.id, 'diamond.media.delete', 'diamond', diamondId)
}

// ── Ring settings ─────────────────────────────────────────────────────────────

export async function listRingSettings(): Promise<RingSetting[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw new Error('Failed to list ring settings')
  return ((data ?? []) as RingSettingRecord[]).map((r) => parseRingSetting(r))
}

export async function getRingSetting(id: string): Promise<RingSetting | null> {
  const admin = createAdminClient()
  const { data: row, error } = await admin
    .from('ring_settings')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('Failed to fetch ring setting')
  if (!row) return null

  const { data: mediaRows } = await admin
    .from('ring_setting_media')
    .select('*')
    .eq('ring_setting_id', id)
    .order('display_order', { ascending: true })

  const { data: diamondRows } = await admin
    .from('diamonds')
    .select('*')
    .eq('ring_setting_id', id)
    .order('carat', { ascending: true })

  const media    = (mediaRows    ?? []) as RingSettingMediaRecord[]
  const diamonds = ((diamondRows ?? []) as DiamondRecord[]).map((d) => parseDiamond(d))
  return parseRingSetting(row as RingSettingRecord, media, diamonds)
}

export async function createRingSetting(
  actor: StaffUser,
  input: CreateRingSettingInput,
): Promise<RingSetting> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .insert({ ...input, created_by: actor.id, updated_by: actor.id })
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to create ring setting')
  await writeAudit(actor.id, 'ring_setting.create', 'ring_setting', data.id)
  return parseRingSetting(data as RingSettingRecord)
}

export async function updateRingSetting(
  actor: StaffUser,
  id:    string,
  patch: UpdateRingSettingInput,
): Promise<RingSetting> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('ring_settings')
    .update({ ...patch, updated_by: actor.id })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Failed to update ring setting')
  await writeAudit(actor.id, 'ring_setting.update', 'ring_setting', id)
  return parseRingSetting(data as RingSettingRecord)
}

export async function deleteRingSetting(actor: StaffUser, id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('ring_settings').delete().eq('id', id)
  if (error) throw new Error(error.message)
  await writeAudit(actor.id, 'ring_setting.delete', 'ring_setting', id)
}
