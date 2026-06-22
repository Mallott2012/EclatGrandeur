import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/diamonds/repository', () => ({
  findDiamondById:     vi.fn(),
  rpcTransitionStatus: vi.fn(),
  rpcExtendHold:       vi.fn(),
}))

import { placeHold, releaseHold, extendHold, transitionStatus } from '@/lib/diamonds/service'
import { rpcTransitionStatus, rpcExtendHold } from '@/lib/diamonds/repository'
import { ServiceException } from '@/lib/errors'
import type { StaffUser } from '@/lib/staff-shared'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SUPER_ADMIN:   StaffUser = { id: 'u-001', email: 'admin@eg.test',   fullName: null, roles: ['super_admin']   }
const DIAMOND_BUYER: StaffUser = { id: 'u-002', email: 'buyer@eg.test',   fullName: null, roles: ['diamond_buyer'] }
const SALES_ADVISER: StaffUser = { id: 'u-003', email: 'adviser@eg.test', fullName: null, roles: ['sales_adviser'] }
const NO_ROLES:      StaffUser = { id: 'u-006', email: 'empty@eg.test',   fullName: null, roles: []                }

const FUTURE_ISO     = '2099-01-01T12:00:00.000Z'
const TRANSITION_ROW = { old_status: 'available', was_expired_hold: false }
const EXTEND_ROW     = { previous_expires_at: '2026-01-01T00:00:00Z', original_held_at: '2026-06-01T00:00:00Z' }

// ── placeHold ─────────────────────────────────────────────────────────────────

describe('placeHold', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rpcTransitionStatus).mockResolvedValue(TRANSITION_ROW)
  })

  const validInput = { diamond_id: 'dia-001', hold_expires_at: FUTURE_ISO, hold_reason: 'client viewing' }

  it('super_admin can place hold', async () => {
    const result = await placeHold(SUPER_ADMIN, validInput)
    expect(result.newStatus).toBe('on_hold')
    expect(rpcTransitionStatus).toHaveBeenCalledWith(SUPER_ADMIN.id, 'dia-001', 'on_hold', FUTURE_ISO, 'client viewing')
  })

  it('sales_adviser can place hold', async () => {
    const result = await placeHold(SALES_ADVISER, validInput)
    expect(result.newStatus).toBe('on_hold')
  })

  it('user with no roles is rejected with not_staff', async () => {
    await expect(placeHold(NO_ROLES, validInput)).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'not_staff',
    )
  })

  it('wraps RPC error as ServiceException', async () => {
    vi.mocked(rpcTransitionStatus).mockRejectedValue({ code: 'P0005', message: 'Invalid transition' })
    await expect(placeHold(SUPER_ADMIN, validInput)).rejects.toBeInstanceOf(ServiceException)
  })

  it('returns wasExpiredHold flag from RPC row', async () => {
    vi.mocked(rpcTransitionStatus).mockResolvedValue({ ...TRANSITION_ROW, was_expired_hold: true })
    const result = await placeHold(SUPER_ADMIN, validInput)
    expect(result.wasExpiredHold).toBe(true)
  })
})

// ── releaseHold ───────────────────────────────────────────────────────────────

describe('releaseHold', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rpcTransitionStatus).mockResolvedValue({ old_status: 'on_hold', was_expired_hold: false })
  })

  it('sales_adviser can release', async () => {
    const result = await releaseHold(SALES_ADVISER, 'dia-001')
    expect(result.newStatus).toBe('available')
    expect(rpcTransitionStatus).toHaveBeenCalledWith(SALES_ADVISER.id, 'dia-001', 'available')
  })

  it('super_admin can release', async () => {
    const result = await releaseHold(SUPER_ADMIN, 'dia-001')
    expect(result.newStatus).toBe('available')
  })

  it('user with no roles is rejected with not_staff', async () => {
    await expect(releaseHold(NO_ROLES, 'dia-001')).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'not_staff',
    )
  })

  it('wraps RPC error as ServiceException', async () => {
    vi.mocked(rpcTransitionStatus).mockRejectedValue({ code: 'P0012', message: 'Not the holder' })
    await expect(releaseHold(SUPER_ADMIN, 'dia-001')).rejects.toBeInstanceOf(ServiceException)
  })
})

// ── extendHold ────────────────────────────────────────────────────────────────

describe('extendHold', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rpcExtendHold).mockResolvedValue(EXTEND_ROW)
  })

  const validExtend = { diamond_id: 'dia-001', new_expires_at: FUTURE_ISO }

  it('sales_adviser can extend hold', async () => {
    const result = await extendHold(SALES_ADVISER, validExtend)
    expect(result.newExpiresAt).toBe(FUTURE_ISO)
    expect(rpcExtendHold).toHaveBeenCalledWith(SALES_ADVISER.id, 'dia-001', FUTURE_ISO, undefined)
  })

  it('returns previousExpiresAt from RPC row', async () => {
    const result = await extendHold(SUPER_ADMIN, validExtend)
    expect(result.previousExpiresAt).toBe(EXTEND_ROW.previous_expires_at)
  })

  it('wraps RPC error as ServiceException', async () => {
    vi.mocked(rpcExtendHold).mockRejectedValue({ code: 'P0021', message: 'Not the holder' })
    await expect(extendHold(SALES_ADVISER, validExtend)).rejects.toBeInstanceOf(ServiceException)
  })
})

// ── transitionStatus ──────────────────────────────────────────────────────────

describe('transitionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(rpcTransitionStatus).mockResolvedValue({ old_status: 'available', was_expired_hold: false })
  })

  it('super_admin can transition to reserved', async () => {
    const result = await transitionStatus(SUPER_ADMIN, { diamond_id: 'dia-001', new_status: 'reserved' })
    expect(result.newStatus).toBe('reserved')
  })

  it('diamond_buyer can transition to sold', async () => {
    vi.mocked(rpcTransitionStatus).mockResolvedValue({ old_status: 'reserved', was_expired_hold: false })
    const result = await transitionStatus(DIAMOND_BUYER, { diamond_id: 'dia-001', new_status: 'sold' })
    expect(result.newStatus).toBe('sold')
  })

  it('sales_adviser cannot call transitionStatus (privileged only)', async () => {
    await expect(transitionStatus(SALES_ADVISER, { diamond_id: 'dia-001', new_status: 'reserved' })).rejects.toSatisfy(
      (e: unknown) => e instanceof ServiceException && e.serviceError.code === 'insufficient_role',
    )
    expect(rpcTransitionStatus).not.toHaveBeenCalled()
  })

  it('wraps RPC error as ServiceException', async () => {
    vi.mocked(rpcTransitionStatus).mockRejectedValue({ code: 'P0005', message: 'Invalid transition' })
    await expect(transitionStatus(SUPER_ADMIN, { diamond_id: 'dia-001', new_status: 'removed' })).rejects.toBeInstanceOf(ServiceException)
  })
})
