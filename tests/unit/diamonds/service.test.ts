import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/diamonds/repository', () => ({
  findManyDiamonds: vi.fn(),
  findDiamondById:  vi.fn(),
}))

import { listDiamonds, getDiamond } from '@/lib/diamonds/service'
import { findManyDiamonds, findDiamondById } from '@/lib/diamonds/repository'
import { DiamondFilterSchema } from '@/lib/diamonds/schemas'
import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import type { DiamondRecord, DiamondListRecord, PaginatedResult } from '@/lib/diamonds/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SUPER_ADMIN:   StaffUser = { id: 'u-001', email: 'admin@eg.test',   fullName: null, roles: ['super_admin']   }
const DIAMOND_BUYER: StaffUser = { id: 'u-002', email: 'buyer@eg.test',   fullName: null, roles: ['diamond_buyer'] }
const SALES_ADVISER: StaffUser = { id: 'u-003', email: 'adviser@eg.test', fullName: null, roles: ['sales_adviser'] }
const CONTENT_ED:    StaffUser = { id: 'u-005', email: 'content@eg.test', fullName: null, roles: ['content_editor']}
const NO_ROLES:      StaffUser = { id: 'u-006', email: 'empty@eg.test',   fullName: null, roles: []               }

const BASE_RECORD: DiamondRecord = {
  id: 'dia-001', sku: 'SKU-001', supplier_id: 'sup-001', supplier_sku: null,
  origin: 'natural', colour_category: 'standard', colour_grade: 'G',
  fancy_colour_hue: null, fancy_colour_intensity: null, fancy_colour_overtone: null,
  shape: 'round', carat: '1.500', clarity: 'VS1', cut: 'Excellent',
  polish: 'Excellent', symmetry: 'Very Good', fluorescence: 'None',
  meas_length_mm: null, meas_width_mm: null, meas_depth_mm: null,
  table_pct: null, depth_pct: null, girdle: null, culet: null,
  cert_lab: 'GIA', cert_number: '1234567890', cert_pdf_path: null,
  retail_price_amount: 5000, retail_price_currency: 'AED',
  supplier_cost_amount: 3000, supplier_cost_currency: 'USD',
  status: 'available', is_visible: true,
  held_by_user_id: null, held_at: null, hold_expires_at: null, hold_reason: null,
  selection_note: null, internal_notes: 'internal notes', last_availability_check: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  created_by: null, updated_by: null,
}

const LIST_RECORD: DiamondListRecord = { ...BASE_RECORD, supplier_code: 'ANTWERP' }

const HELD_BY_ADVISER: DiamondListRecord = {
  ...LIST_RECORD,
  id: 'dia-002',
  status: 'on_hold',
  held_by_user_id: SALES_ADVISER.id,
  held_at: '2026-06-20T10:00:00Z',
  hold_expires_at: '2099-01-01T00:00:00Z',
  hold_reason: 'client viewing',
}

const HELD_BY_OTHER: DiamondListRecord = {
  ...LIST_RECORD,
  id: 'dia-003',
  status: 'on_hold',
  held_by_user_id: 'u-999',
  held_at: '2026-06-20T10:00:00Z',
  hold_expires_at: '2099-01-01T00:00:00Z',
  hold_reason: 'other adviser hold',
}

const DEFAULT_FILTER = DiamondFilterSchema.parse({})

function makePaginated(items: DiamondListRecord[]): PaginatedResult<DiamondListRecord> {
  return { items, page: 1, limit: 50, total: items.length }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(findManyDiamonds).mockResolvedValue(makePaginated([LIST_RECORD]))
  vi.mocked(findDiamondById).mockResolvedValue(BASE_RECORD)
})

// ── listDiamonds — DTO branching ──────────────────────────────────────────────

describe('listDiamonds — role-based DTO', () => {
  it('super_admin receives DiamondFull items with supplier_code', async () => {
    const result = await listDiamonds(SUPER_ADMIN, DEFAULT_FILTER)

    expect(result.items).toHaveLength(1)
    const item = result.items[0] as unknown as Record<string, unknown>
    expect(item.supplier_code).toBe('ANTWERP')
    expect(item.supplier_cost_amount).toBe(3000)
    expect(item.internal_notes).toBe('internal notes')
    expect(item.cert_pdf_path).toBeUndefined()
  })

  it('diamond_buyer receives DiamondFull items', async () => {
    const result = await listDiamonds(DIAMOND_BUYER, DEFAULT_FILTER)

    const item = result.items[0] as unknown as Record<string, unknown>
    expect(item.supplier_code).toBe('ANTWERP')
    expect(item.supplier_cost_amount).toBe(3000)
  })

  it('sales_adviser receives DiamondSalesView items (no supplier, no cost, no internal notes)', async () => {
    const result = await listDiamonds(SALES_ADVISER, DEFAULT_FILTER)

    const item = result.items[0] as unknown as Record<string, unknown>
    expect(item.supplier_id).toBeUndefined()
    expect(item.supplier_sku).toBeUndefined()
    expect(item.supplier_cost_amount).toBeUndefined()
    expect(item.supplier_cost_currency).toBeUndefined()
    expect(item.internal_notes).toBeUndefined()
    expect(item.cert_pdf_path).toBeUndefined()
    expect(item.held_by_user_id).toBeUndefined()
    // supplier_code was on the list record — must not appear in the sales view
    expect(item.supplier_code).toBeUndefined()
  })

  it('sales_adviser receives retail price and cert lab+number', async () => {
    const result = await listDiamonds(SALES_ADVISER, DEFAULT_FILTER)

    const item = result.items[0] as unknown as Record<string, unknown>
    expect(item.retail_price_amount).toBe(5000)
    expect(item.cert_lab).toBe('GIA')
    expect(item.cert_number).toBe('1234567890')
  })
})

// ── listDiamonds — status scope enforcement ───────────────────────────────────

describe('listDiamonds — sales_adviser status scope', () => {
  it('calls findManyDiamonds with statusOverride for sales_adviser', async () => {
    await listDiamonds(SALES_ADVISER, DEFAULT_FILTER)

    const [, statusOverride] = vi.mocked(findManyDiamonds).mock.calls[0]
    expect(statusOverride).toEqual(['available', 'on_hold', 'reserved'])
  })

  it('does not pass a statusOverride for super_admin', async () => {
    await listDiamonds(SUPER_ADMIN, DEFAULT_FILTER)

    const [, statusOverride] = vi.mocked(findManyDiamonds).mock.calls[0]
    expect(statusOverride).toBeUndefined()
  })

  it('does not pass a statusOverride for diamond_buyer', async () => {
    await listDiamonds(DIAMOND_BUYER, DEFAULT_FILTER)

    const [, statusOverride] = vi.mocked(findManyDiamonds).mock.calls[0]
    expect(statusOverride).toBeUndefined()
  })

  it('content_editor passes through as non-privileged (gets sales_adviser view)', async () => {
    // content_editor is denied at the PAGE level via requireStaffRole.
    // At the service level, they have a role so requireAnyStaff passes.
    const result = await listDiamonds(CONTENT_ED, DEFAULT_FILTER)

    const [, statusOverride] = vi.mocked(findManyDiamonds).mock.calls[0]
    expect(statusOverride).toEqual(['available', 'on_hold', 'reserved'])
    const item = result.items[0] as unknown as Record<string, unknown>
    expect(item.supplier_id).toBeUndefined()
  })

  it('actor with no roles is denied by requireAnyStaff before any repository call', async () => {
    await expect(listDiamonds(NO_ROLES, DEFAULT_FILTER)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'not_staff',
    )

    expect(vi.mocked(findManyDiamonds)).not.toHaveBeenCalled()
  })
})

// ── listDiamonds — isMyHold logic ─────────────────────────────────────────────

describe('listDiamonds — isMyHold in DiamondSalesView', () => {
  it('isMyHold is true when held_by_user_id matches the actor', async () => {
    vi.mocked(findManyDiamonds).mockResolvedValue(makePaginated([HELD_BY_ADVISER]))

    const result = await listDiamonds(SALES_ADVISER, DEFAULT_FILTER)

    const item = result.items[0] as unknown as Record<string, unknown>
    expect(item.isMyHold).toBe(true)
    expect(item.hold_reason).toBe('client viewing')
  })

  it('hold_reason is null when the hold belongs to another user', async () => {
    vi.mocked(findManyDiamonds).mockResolvedValue(makePaginated([HELD_BY_OTHER]))

    const result = await listDiamonds(SALES_ADVISER, DEFAULT_FILTER)

    const item = result.items[0] as unknown as Record<string, unknown>
    expect(item.isMyHold).toBe(false)
    expect(item.hold_reason).toBeNull()
  })
})

// ── getDiamond ────────────────────────────────────────────────────────────────

describe('getDiamond', () => {
  it('super_admin receives DiamondFull with supplier_code null (single lookup has no join)', async () => {
    const result = await getDiamond(SUPER_ADMIN, 'dia-001')

    const item = result as unknown as Record<string, unknown>
    expect(item.supplier_code).toBeNull()
    expect(item.supplier_cost_amount).toBe(3000)
  })

  it('throws not_found when diamond does not exist', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(null)

    await expect(getDiamond(SUPER_ADMIN, 'dia-xxx')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'not_found',
    )
  })
})
