import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { DiamondRecord, DiamondListRecord, DiamondMediaRecord, PaginatedResult } from './types'
import type { CreateDiamondInput, UpdateDiamondInput, DiamondFilter } from './schemas'

// All functions create a fresh admin client per call (stateless, safe for Next.js
// concurrent server components and actions).

// ── Diamond CRUD ──────────────────────────────────────────────────────────────

export async function findDiamondById(id: string): Promise<DiamondRecord | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamonds')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch diamond', statusHint: 500 })
  return data as DiamondRecord | null
}

export async function findManyDiamonds(
  filter: DiamondFilter,
  statusOverride?: string[],
): Promise<PaginatedResult<DiamondListRecord>> {
  const admin = createAdminClient()
  const { page, limit, sort_by, sort_dir, ...filters } = filter
  const from = (page - 1) * limit
  const to   = from + limit - 1

  // Left-join suppliers to get supplier_code for privileged list views.
  let query = admin.from('diamonds').select('*, suppliers(code)', { count: 'exact' })

  // expired_hold takes precedence over the status filter — it forces status='on_hold'
  // with a hold_expires_at < now() condition.
  if (filters.expired_hold) {
    query = query.eq('status', 'on_hold').lt('hold_expires_at', new Date().toISOString())
  } else {
    const statuses = statusOverride ?? filters.status
    if (statuses && statuses.length > 0) query = query.in('status', statuses)
  }

  if (filters.shape        && filters.shape.length > 0) query = query.in('shape', filters.shape)
  if (filters.colour_category)  query = query.eq('colour_category', filters.colour_category)
  if (filters.cert_lab)         query = query.eq('cert_lab', filters.cert_lab)
  if (filters.is_visible !== undefined) query = query.eq('is_visible', filters.is_visible)
  if (filters.supplier_id)      query = query.eq('supplier_id', filters.supplier_id)
  if (filters.min_carat != null) query = query.gte('carat', filters.min_carat.toString())
  if (filters.max_carat != null) query = query.lte('carat', filters.max_carat.toString())
  if (filters.min_price != null) query = query.gte('retail_price_amount', filters.min_price)
  if (filters.max_price != null) query = query.lte('retail_price_amount', filters.max_price)
  // T5 extended filters
  if (filters.origin)            query = query.eq('origin', filters.origin)
  if (filters.colour_grade)      query = query.eq('colour_grade', filters.colour_grade)
  if (filters.fancy_colour_hue)       query = query.eq('fancy_colour_hue', filters.fancy_colour_hue)
  if (filters.fancy_colour_intensity) query = query.eq('fancy_colour_intensity', filters.fancy_colour_intensity)
  if (filters.stale_check_days != null) {
    const cutoff = new Date(Date.now() - filters.stale_check_days * 86_400_000).toISOString()
    query = query.or(`last_availability_check.is.null,last_availability_check.lt.${cutoff}`)
  }

  const { data, count, error } = await query
    .order(sort_by, { ascending: sort_dir === 'asc' })
    .range(from, to)

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list diamonds', statusHint: 500 })

  // Extract supplier_code from the nested join result and flatten into DiamondListRecord.
  const items: DiamondListRecord[] = (data ?? []).map((row) => {
    const { suppliers, ...rest } = row as unknown as DiamondRecord & { suppliers: { code: string } | null }
    return { ...rest, supplier_code: suppliers?.code ?? null }
  })

  return { items, page, limit, total: count ?? 0 }
}

export async function insertDiamond(
  input: CreateDiamondInput,
  createdBy: string,
): Promise<DiamondRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamonds')
    .insert({ ...input, created_by: createdBy, updated_by: createdBy })
    .select()
    .single()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to create diamond', statusHint: 500 })
  return data as DiamondRecord
}

export async function updateDiamond(
  id: string,
  patch: UpdateDiamondInput,
  updatedBy: string,
): Promise<DiamondRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamonds')
    .update({ ...patch, updated_by: updatedBy })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new ServiceException({ code: 'db_error', message: 'Failed to update diamond', statusHint: 500 })
  return data as DiamondRecord
}

// Updates only the cert_pdf_path column — called exclusively by certificates.ts.
export async function setCertPdfPath(
  id: string,
  path: string,
  updatedBy: string,
): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('diamonds')
    .update({ cert_pdf_path: path, updated_by: updatedBy })
    .eq('id', id)

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to update certificate path', statusHint: 500 })
}

// ── RPC wrappers ──────────────────────────────────────────────────────────────
// The RPCs perform their own authorisation checks (SECURITY DEFINER, service_role).
// Errors raised by the RPCs are mapped to ServiceErrors by mapRpcError in service.ts.

export async function rpcTransitionStatus(
  actorUserId: string,
  diamondId:   string,
  newStatus:   string,
  holdExpiresAt?: string,
  holdReason?:    string,
): Promise<{ old_status: string; was_expired_hold: boolean }> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('transition_diamond_status', {
    p_actor_user_id:  actorUserId,
    p_diamond_id:     diamondId,
    p_new_status:     newStatus,
    p_hold_expires_at: holdExpiresAt ?? null,
    p_hold_reason:     holdReason    ?? null,
  })

  if (error) throw error
  const row = (data as Array<{ old_status: string; was_expired_hold: boolean }>)[0]
  return row
}

export async function rpcExtendHold(
  actorUserId:  string,
  diamondId:    string,
  newExpiresAt: string,
  holdReason?:  string,
): Promise<{ previous_expires_at: string; original_held_at: string }> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('extend_diamond_hold', {
    p_actor_user_id:  actorUserId,
    p_diamond_id:     diamondId,
    p_new_expires_at: newExpiresAt,
    p_hold_reason:    holdReason ?? null,
  })

  if (error) throw error
  const row = (data as Array<{ previous_expires_at: string; original_held_at: string }>)[0]
  return row
}

// ── Diamond media CRUD ────────────────────────────────────────────────────────

export async function findMediaByDiamond(diamondId: string): Promise<DiamondMediaRecord[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamond_media')
    .select('*')
    .eq('diamond_id', diamondId)
    .order('display_order', { ascending: true })

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch media', statusHint: 500 })
  return (data ?? []) as DiamondMediaRecord[]
}

export async function findMediaById(id: string): Promise<DiamondMediaRecord | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamond_media')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch media record', statusHint: 500 })
  return data as DiamondMediaRecord | null
}

export async function insertMediaRecord(record: {
  diamond_id:    string
  media_type:    string
  storage_path:  string
  display_order: number
  alt_text:      string | null
  is_primary:    boolean
}): Promise<DiamondMediaRecord> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('diamond_media')
    .insert(record)
    .select()
    .single()

  if (error || !data) throw new ServiceException({ code: 'db_error', message: 'Failed to insert media record', statusHint: 500 })
  return data as DiamondMediaRecord
}

export async function deleteMediaRecord(id: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.from('diamond_media').delete().eq('id', id)
  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to delete media record', statusHint: 500 })
}

// Clears the primary flag on all media for a diamond, then sets it on one record.
// Caller must verify mediaId belongs to diamondId before calling.
export async function setPrimaryMediaRecord(mediaId: string, diamondId: string): Promise<void> {
  const admin = createAdminClient()

  // Verify ownership before mutation.
  const { data: record } = await admin
    .from('diamond_media')
    .select('id')
    .eq('id', mediaId)
    .eq('diamond_id', diamondId)
    .maybeSingle()
  if (!record) throw new ServiceException({ code: 'not_found', message: 'Media record not found', statusHint: 404 })

  const { error: clearErr } = await admin
    .from('diamond_media')
    .update({ is_primary: false })
    .eq('diamond_id', diamondId)
  if (clearErr) throw new ServiceException({ code: 'db_error', message: 'Failed to update primary media', statusHint: 500 })

  const { error: setErr } = await admin
    .from('diamond_media')
    .update({ is_primary: true })
    .eq('id', mediaId)
  if (setErr) throw new ServiceException({ code: 'db_error', message: 'Failed to update primary media', statusHint: 500 })
}
