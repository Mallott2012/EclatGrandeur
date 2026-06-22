import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceException } from '@/lib/errors'
import type { SupplierRow } from './types'
import type { CreateSupplierInput, UpdateSupplierInput, SupplierFilter } from './schemas'
import type { PaginatedResult } from '@/lib/diamonds/types'

export async function findSupplierById(id: string): Promise<SupplierRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to fetch supplier', statusHint: 500 })
  return data as SupplierRow | null
}

export async function findManySuppliers(filter: SupplierFilter): Promise<PaginatedResult<SupplierRow>> {
  const admin = createAdminClient()
  const { page, limit, ...filters } = filter
  const from = (page - 1) * limit
  const to   = from + limit - 1

  let query = admin.from('suppliers').select('*', { count: 'exact' })
  if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active)
  if (filters.currency)               query = query.eq('currency', filters.currency)

  const { data, count, error } = await query
    .order('name', { ascending: true })
    .range(from, to)

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to list suppliers', statusHint: 500 })
  return { items: (data ?? []) as SupplierRow[], page, limit, total: count ?? 0 }
}

export async function insertSupplier(input: CreateSupplierInput): Promise<SupplierRow> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('suppliers')
    .insert(input)
    .select()
    .single()

  if (error || !data) throw new ServiceException({ code: 'db_error', message: 'Failed to create supplier', statusHint: 500 })
  return data as SupplierRow
}

export async function updateSupplier(id: string, patch: UpdateSupplierInput): Promise<SupplierRow> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('suppliers')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error || !data) throw new ServiceException({ code: 'db_error', message: 'Failed to update supplier', statusHint: 500 })
  return data as SupplierRow
}

// Count active diamonds for this supplier (available | on_hold | reserved).
// Used by deactivateSupplier to pre-check before setting is_active=false.
export async function countActiveDiamondsBySupplier(supplierId: string): Promise<number> {
  const admin = createAdminClient()
  const { count, error } = await admin
    .from('diamonds')
    .select('id', { count: 'exact', head: true })
    .eq('supplier_id', supplierId)
    .in('status', ['available', 'on_hold', 'reserved'])

  if (error) throw new ServiceException({ code: 'db_error', message: 'Failed to count supplier diamonds', statusHint: 500 })
  return count ?? 0
}
