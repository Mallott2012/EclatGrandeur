import 'server-only'

import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import { toSupplierFull, type SupplierFull } from './types'
import {
  findSupplierById,
  findManySuppliers,
  insertSupplier,
  updateSupplier,
  countActiveDiamondsBySupplier,
} from './repository'
import type { CreateSupplierInput, UpdateSupplierInput, SupplierFilter } from './schemas'
import type { PaginatedResult } from '@/lib/diamonds/types'

function requirePrivileged(actor: StaffUser): void {
  const ok = actor.roles.includes('super_admin') || actor.roles.includes('diamond_buyer')
  if (!ok) {
    throw new ServiceException({ code: 'insufficient_role', message: "You don't have permission to manage suppliers", statusHint: 403 })
  }
}

export async function getSupplier(actor: StaffUser, id: string): Promise<SupplierFull> {
  requirePrivileged(actor)
  const row = await findSupplierById(id)
  if (!row) throw new ServiceException({ code: 'not_found', message: 'Supplier not found', statusHint: 404 })
  return toSupplierFull(row)
}

export async function listSuppliers(
  actor:  StaffUser,
  filter: SupplierFilter,
): Promise<PaginatedResult<SupplierFull>> {
  requirePrivileged(actor)
  const result = await findManySuppliers(filter)
  return { ...result, items: result.items.map(toSupplierFull) }
}

export async function createSupplier(
  actor: StaffUser,
  input: CreateSupplierInput,
): Promise<SupplierFull> {
  requirePrivileged(actor)
  const row = await insertSupplier(input)
  return toSupplierFull(row)
}

export async function patchSupplier(
  actor: StaffUser,
  id:    string,
  patch: UpdateSupplierInput,
): Promise<SupplierFull> {
  requirePrivileged(actor)
  const existing = await findSupplierById(id)
  if (!existing) throw new ServiceException({ code: 'not_found', message: 'Supplier not found', statusHint: 404 })

  const row = await updateSupplier(id, patch)
  return toSupplierFull(row)
}

// Sets is_active=false. Pre-checks for active diamonds — callers must resolve
// those diamonds before deactivating the supplier.
export async function deactivateSupplier(actor: StaffUser, id: string): Promise<SupplierFull> {
  requirePrivileged(actor)

  const existing = await findSupplierById(id)
  if (!existing) throw new ServiceException({ code: 'not_found', message: 'Supplier not found', statusHint: 404 })
  if (!existing.is_active) throw new ServiceException({ code: 'already_inactive', message: 'Supplier is already inactive', statusHint: 409 })

  const activeDiamonds = await countActiveDiamondsBySupplier(id)
  if (activeDiamonds > 0) {
    throw new ServiceException({
      code:       'supplier_has_active_diamonds',
      message:    `Cannot deactivate supplier: ${activeDiamonds} active diamond(s) reference this supplier`,
      statusHint: 409,
    })
  }

  const row = await updateSupplier(id, { is_active: false })
  return toSupplierFull(row)
}
