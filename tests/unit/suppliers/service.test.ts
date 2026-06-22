import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/suppliers/repository', () => ({
  findSupplierById:          vi.fn(),
  findManySuppliers:         vi.fn(),
  insertSupplier:            vi.fn(),
  updateSupplier:            vi.fn(),
  countActiveDiamondsBySupplier: vi.fn(),
}))

import { createSupplier, patchSupplier, deactivateSupplier, listSuppliers } from '@/lib/suppliers/service'
import {
  findSupplierById,
  insertSupplier,
  updateSupplier,
  countActiveDiamondsBySupplier,
  findManySuppliers,
} from '@/lib/suppliers/repository'
import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import type { SupplierRow } from '@/lib/suppliers/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SUPER_ADMIN:    StaffUser = { id: 'u-001', email: 'admin@eg.test',   fullName: null, roles: ['super_admin'] }
const DIAMOND_BUYER:  StaffUser = { id: 'u-002', email: 'buyer@eg.test',   fullName: null, roles: ['diamond_buyer'] }
const SALES_ADVISER:  StaffUser = { id: 'u-003', email: 'adviser@eg.test', fullName: null, roles: ['sales_adviser'] }
const CONTENT_ED:     StaffUser = { id: 'u-005', email: 'content@eg.test', fullName: null, roles: ['content_editor'] }

const SUPPLIER_ROW: SupplierRow = {
  id: 'sup-001', name: 'Antwerp Diamonds BV', code: 'ANTWERP',
  contact_name: 'Jan De Smet', email: 'jan@antwerp.test',
  phone: '+3222001234', country: 'BE', currency: 'EUR',
  notes: 'Preferred rough supplier', is_active: true,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

const CREATE_INPUT = {
  name: 'New Supplier Ltd', code: 'NEW_SUP', currency: 'USD',
  contact_name: null, email: null, phone: null, country: null,
  notes: null, is_active: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(findSupplierById).mockResolvedValue(SUPPLIER_ROW)
  vi.mocked(insertSupplier).mockResolvedValue({ ...SUPPLIER_ROW, ...CREATE_INPUT, id: 'sup-002' })
  vi.mocked(updateSupplier).mockResolvedValue(SUPPLIER_ROW)
  vi.mocked(countActiveDiamondsBySupplier).mockResolvedValue(0)
  vi.mocked(findManySuppliers).mockResolvedValue({ items: [SUPPLIER_ROW], page: 1, limit: 50, total: 1 })
})

// ── createSupplier ────────────────────────────────────────────────────────────

describe('createSupplier', () => {
  it('super_admin can create a valid supplier', async () => {
    const result = await createSupplier(SUPER_ADMIN, CREATE_INPUT)

    expect(vi.mocked(insertSupplier)).toHaveBeenCalledWith(CREATE_INPUT)
    expect(result.code).toBe(CREATE_INPUT.code)
  })

  it('diamond_buyer can create a valid supplier', async () => {
    await createSupplier(DIAMOND_BUYER, CREATE_INPUT)

    expect(vi.mocked(insertSupplier)).toHaveBeenCalledOnce()
  })

  it('sales_adviser is denied before any repository call', async () => {
    await expect(createSupplier(SALES_ADVISER, CREATE_INPUT)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(insertSupplier)).not.toHaveBeenCalled()
  })

  it('content_editor is denied before any repository call', async () => {
    await expect(createSupplier(CONTENT_ED, CREATE_INPUT)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(insertSupplier)).not.toHaveBeenCalled()
  })
})

// ── patchSupplier ─────────────────────────────────────────────────────────────

describe('patchSupplier', () => {
  it('super_admin can edit a supplier', async () => {
    const patched = { ...SUPPLIER_ROW, name: 'Renamed Supplier' }
    vi.mocked(updateSupplier).mockResolvedValue(patched)

    const result = await patchSupplier(SUPER_ADMIN, 'sup-001', { name: 'Renamed Supplier' })

    expect(vi.mocked(updateSupplier)).toHaveBeenCalledWith('sup-001', { name: 'Renamed Supplier' })
    expect(result.name).toBe('Renamed Supplier')
  })

  it('diamond_buyer can edit a supplier', async () => {
    await patchSupplier(DIAMOND_BUYER, 'sup-001', { currency: 'GBP' })

    expect(vi.mocked(updateSupplier)).toHaveBeenCalledOnce()
  })

  it('sales_adviser is denied before any repository call', async () => {
    await expect(patchSupplier(SALES_ADVISER, 'sup-001', {})).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(findSupplierById)).not.toHaveBeenCalled()
    expect(vi.mocked(updateSupplier)).not.toHaveBeenCalled()
  })

  it('content_editor is denied before any repository call', async () => {
    await expect(patchSupplier(CONTENT_ED, 'sup-001', {})).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(findSupplierById)).not.toHaveBeenCalled()
  })
})

// ── deactivateSupplier ────────────────────────────────────────────────────────

describe('deactivateSupplier', () => {
  it('super_admin can deactivate a supplier with no active diamonds', async () => {
    vi.mocked(countActiveDiamondsBySupplier).mockResolvedValue(0)

    await deactivateSupplier(SUPER_ADMIN, 'sup-001')

    expect(vi.mocked(updateSupplier)).toHaveBeenCalledWith('sup-001', { is_active: false })
  })

  it('diamond_buyer can deactivate a supplier with no active diamonds', async () => {
    vi.mocked(countActiveDiamondsBySupplier).mockResolvedValue(0)

    await deactivateSupplier(DIAMOND_BUYER, 'sup-001')

    expect(vi.mocked(updateSupplier)).toHaveBeenCalledWith('sup-001', { is_active: false })
  })

  it('deactivation is blocked when available diamonds exist', async () => {
    vi.mocked(countActiveDiamondsBySupplier).mockResolvedValue(3)

    await expect(deactivateSupplier(SUPER_ADMIN, 'sup-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'supplier_has_active_diamonds',
    )

    expect(vi.mocked(updateSupplier)).not.toHaveBeenCalled()
  })

  it('deactivation is blocked when on_hold or reserved diamonds exist', async () => {
    vi.mocked(countActiveDiamondsBySupplier).mockResolvedValue(1)

    await expect(deactivateSupplier(SUPER_ADMIN, 'sup-001')).rejects.toSatisfy(
      (e: unknown) =>
        e instanceof ServiceException && e.serviceError.statusHint === 409,
    )
  })

  it('deactivation succeeds when all linked diamonds are sold or removed (count = 0)', async () => {
    vi.mocked(countActiveDiamondsBySupplier).mockResolvedValue(0)
    const deactivated = { ...SUPPLIER_ROW, is_active: false }
    vi.mocked(updateSupplier).mockResolvedValue(deactivated)

    const result = await deactivateSupplier(SUPER_ADMIN, 'sup-001')

    expect(result.is_active).toBe(false)
  })

  it('sales_adviser is denied before any repository call', async () => {
    await expect(deactivateSupplier(SALES_ADVISER, 'sup-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(findSupplierById)).not.toHaveBeenCalled()
    expect(vi.mocked(countActiveDiamondsBySupplier)).not.toHaveBeenCalled()
  })

  it('content_editor is denied before any repository call', async () => {
    await expect(deactivateSupplier(CONTENT_ED, 'sup-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )

    expect(vi.mocked(findSupplierById)).not.toHaveBeenCalled()
  })
})
