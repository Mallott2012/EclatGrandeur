import { describe, it, expect, vi, beforeEach } from 'vitest'

// RPC wrapper functions live in the server-only repository module.
// The server-only guard is stubbed via the vitest.config.ts alias.
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { rpcTransitionStatus, rpcExtendHold } from '@/lib/diamonds/repository'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreateDiamondSchema } from '@/lib/diamonds/schemas'

// ── Schema integrity ──────────────────────────────────────────────────────────
// Zod uses strip mode by default: unknown keys submitted by callers are silently
// removed from the parsed output. These tests verify that actor-identity and
// repository-internal fields cannot enter the service layer via user-supplied data.

const VALID_DIAMOND_INPUT = {
  shape: 'round' as const, carat: 1.5, clarity: 'VS1' as const,
  polish: 'Excellent' as const, symmetry: 'Very Good' as const,
  colour_category: 'standard' as const, colour_grade: 'G' as const,
}

describe('CreateDiamondSchema — no public actor or audit fields', () => {
  it('strips actor_id submitted by a caller — actor identity is always server-set', () => {
    const result = CreateDiamondSchema.safeParse({ ...VALID_DIAMOND_INPUT, actor_id: 'hacked' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty('actor_id')
  })

  it('strips updated_by submitted by a caller — set exclusively by the repository', () => {
    const result = CreateDiamondSchema.safeParse({ ...VALID_DIAMOND_INPUT, updated_by: 'hacked' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty('updated_by')
  })

  it('strips created_by submitted by a caller — set exclusively by the repository', () => {
    const result = CreateDiamondSchema.safeParse({ ...VALID_DIAMOND_INPUT, created_by: 'hacked' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty('created_by')
  })
})

// ── RPC wrapper — actor identity ──────────────────────────────────────────────

function makeRpcMock(returnData: unknown) {
  const mockRpc = vi.fn().mockResolvedValue({ data: returnData, error: null })
  const admin   = { rpc: mockRpc }
  vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>)
  return mockRpc
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('rpcTransitionStatus', () => {
  it('passes the caller-supplied actorUserId as p_actor_user_id, not a hardcoded value', async () => {
    const mockRpc = makeRpcMock([{ old_status: 'available', was_expired_hold: false }])

    await rpcTransitionStatus('actor-abc', 'dia-001', 'on_hold', '2027-06-01T12:00:00Z', 'client viewing')

    const [rpcName, params] = mockRpc.mock.calls[0]
    expect(rpcName).toBe('transition_diamond_status')
    expect((params as Record<string, unknown>).p_actor_user_id).toBe('actor-abc')
  })

  it('passes diamond ID and new status separately from actor identity', async () => {
    const mockRpc = makeRpcMock([{ old_status: 'available', was_expired_hold: false }])

    await rpcTransitionStatus('actor-abc', 'dia-999', 'reserved')

    const [, params] = mockRpc.mock.calls[0]
    const p = params as Record<string, unknown>
    expect(p.p_actor_user_id).toBe('actor-abc')
    expect(p.p_diamond_id).toBe('dia-999')
    expect(p.p_new_status).toBe('reserved')
    // actor_id must not be mixed into the diamond or status parameters
    expect(p.p_diamond_id).not.toBe(p.p_actor_user_id)
  })

  it('throws the raw RPC error object so the service layer can map it', async () => {
    const rpcError = { code: 'P0001', message: 'not_staff' }
    const mockRpc  = vi.fn().mockResolvedValue({ data: null, error: rpcError })
    vi.mocked(createAdminClient).mockReturnValue(
      { rpc: mockRpc } as unknown as ReturnType<typeof createAdminClient>,
    )

    await expect(rpcTransitionStatus('actor-abc', 'dia-001', 'available')).rejects.toMatchObject(rpcError)
  })
})

describe('rpcExtendHold', () => {
  it('passes the caller-supplied actorUserId as p_actor_user_id', async () => {
    const mockRpc = makeRpcMock([{ previous_expires_at: '2026-07-01T00:00:00Z', original_held_at: '2026-06-01T00:00:00Z' }])

    await rpcExtendHold('actor-xyz', 'dia-001', '2027-01-01T00:00:00Z', 'extension reason')

    const [rpcName, params] = mockRpc.mock.calls[0]
    expect(rpcName).toBe('extend_diamond_hold')
    expect((params as Record<string, unknown>).p_actor_user_id).toBe('actor-xyz')
  })
})
