import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/diamonds/repository', () => ({
  findDiamondById: vi.fn(),
  insertDiamond:   vi.fn(),
  updateDiamond:   vi.fn(),
}))

import { createDiamond, patchDiamond } from '@/lib/diamonds/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { findDiamondById, insertDiamond, updateDiamond } from '@/lib/diamonds/repository'
import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'
import type { DiamondRecord } from '@/lib/diamonds/types'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SUPER_ADMIN:   StaffUser = { id: 'u-001', email: 'admin@eg.test',   fullName: null, roles: ['super_admin']   }
const DIAMOND_BUYER: StaffUser = { id: 'u-002', email: 'buyer@eg.test',   fullName: null, roles: ['diamond_buyer'] }
const SALES_ADVISER: StaffUser = { id: 'u-003', email: 'adviser@eg.test', fullName: null, roles: ['sales_adviser'] }

const BASE_RECORD: DiamondRecord = {
  id: 'dia-001', sku: 'EGD-2026-000001', supplier_id: null, supplier_sku: null,
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
  selection_note: null, internal_notes: null, last_availability_check: null,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  created_by: null, updated_by: null,
}

const VALID_CREATE_INPUT = {
  origin:                 'natural' as const,
  colour_category:        'standard' as const,
  colour_grade:           'G' as const,
  shape:                  'round' as const,
  carat:                  1.5,
  clarity:                'VS1' as const,
  polish:                 'Excellent' as const,
  symmetry:               'Very Good' as const,
  fluorescence:           'None' as const,
  retail_price_currency:  'AED' as const,
  supplier_cost_currency: 'USD' as const,
  is_visible:             false,
}

function makeAuditClient() {
  const insert = vi.fn().mockResolvedValue({ error: null })
  return { from: vi.fn().mockReturnValue({ insert }) }
}

// ── createDiamond ─────────────────────────────────────────────────────────────

describe('createDiamond', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(insertDiamond).mockResolvedValue(BASE_RECORD)
    vi.mocked(createAdminClient).mockReturnValue(makeAuditClient() as never)
  })

  it('super_admin can create a diamond', async () => {
    const result = await createDiamond(SUPER_ADMIN, VALID_CREATE_INPUT)
    expect(result.id).toBe('dia-001')
    expect(result.sku).toBe('EGD-2026-000001')
    expect(insertDiamond).toHaveBeenCalledWith(VALID_CREATE_INPUT, SUPER_ADMIN.id)
  })

  it('diamond_buyer can create a diamond', async () => {
    const result = await createDiamond(DIAMOND_BUYER, VALID_CREATE_INPUT)
    expect(result.id).toBe('dia-001')
    expect(insertDiamond).toHaveBeenCalledWith(VALID_CREATE_INPUT, DIAMOND_BUYER.id)
  })

  it('sales_adviser is rejected with insufficient_role', async () => {
    await expect(createDiamond(SALES_ADVISER, VALID_CREATE_INPUT)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )
  })

  it('writes non-blocking audit entry after insert', async () => {
    const client = makeAuditClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await createDiamond(SUPER_ADMIN, VALID_CREATE_INPUT)
    expect(client.from).toHaveBeenCalledWith('audit_logs')
  })

  it('does NOT throw when audit write fails', async () => {
    const failClient = {
      from: vi.fn().mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: new Error('db down') }) }),
    }
    vi.mocked(createAdminClient).mockReturnValue(failClient as never)
    await expect(createDiamond(SUPER_ADMIN, VALID_CREATE_INPUT)).resolves.toBeDefined()
  })

  it('DiamondFull omits cert_pdf_path', async () => {
    const result = await createDiamond(SUPER_ADMIN, VALID_CREATE_INPUT)
    expect('cert_pdf_path' in result).toBe(false)
  })
})

// ── patchDiamond ──────────────────────────────────────────────────────────────

describe('patchDiamond', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(findDiamondById).mockResolvedValue(BASE_RECORD)
    vi.mocked(updateDiamond).mockResolvedValue({ ...BASE_RECORD, retail_price_amount: 6000 })
    vi.mocked(createAdminClient).mockReturnValue(makeAuditClient() as never)
  })

  it('super_admin can patch', async () => {
    const result = await patchDiamond(SUPER_ADMIN, 'dia-001', { retail_price_amount: 6000 })
    expect(result.retail_price_amount).toBe(6000)
  })

  it('throws not_found when diamond does not exist', async () => {
    vi.mocked(findDiamondById).mockResolvedValue(null)
    await expect(patchDiamond(SUPER_ADMIN, 'missing', {})).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'not_found',
    )
  })

  it('throws terminal_status when diamond is sold', async () => {
    vi.mocked(findDiamondById).mockResolvedValue({ ...BASE_RECORD, status: 'sold' })
    await expect(patchDiamond(SUPER_ADMIN, 'dia-001', { selection_note: 'x' })).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'terminal_status',
    )
  })

  it('throws terminal_status when diamond is removed', async () => {
    vi.mocked(findDiamondById).mockResolvedValue({ ...BASE_RECORD, status: 'removed' })
    await expect(patchDiamond(SUPER_ADMIN, 'dia-001', { selection_note: 'x' })).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'terminal_status',
    )
  })

  it('throws validation_error when switching to fancy without hue', async () => {
    await expect(patchDiamond(SUPER_ADMIN, 'dia-001', {
      colour_category:        'fancy',
      fancy_colour_intensity: 'Fancy',
    })).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'validation_error',
    )
  })

  it('throws validation_error when is_visible true but cert missing', async () => {
    vi.mocked(findDiamondById).mockResolvedValue({ ...BASE_RECORD, cert_lab: null, cert_number: null })
    await expect(patchDiamond(SUPER_ADMIN, 'dia-001', { is_visible: true })).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'validation_error',
    )
  })

  it('writes diamond.visibility_changed audit when is_visible changes', async () => {
    const client = makeAuditClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    vi.mocked(findDiamondById).mockResolvedValue({ ...BASE_RECORD, is_visible: false })
    vi.mocked(updateDiamond).mockResolvedValue({ ...BASE_RECORD, is_visible: true })
    await patchDiamond(SUPER_ADMIN, 'dia-001', { is_visible: true })
    // Two inserts: diamond.update + diamond.visibility_changed
    expect(client.from).toHaveBeenCalledTimes(2)
  })

  it('does NOT write visibility_changed audit when is_visible unchanged', async () => {
    const client = makeAuditClient()
    vi.mocked(createAdminClient).mockReturnValue(client as never)
    await patchDiamond(SUPER_ADMIN, 'dia-001', { is_visible: true })
    // Only one insert: diamond.update (existing is_visible already true)
    expect(client.from).toHaveBeenCalledTimes(1)
  })

  it('sales_adviser cannot patch', async () => {
    await expect(patchDiamond(SALES_ADVISER, 'dia-001', {})).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )
  })
})
