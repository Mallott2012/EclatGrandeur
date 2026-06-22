import { describe, it, expect } from 'vitest'
import { mapRpcError } from '@/lib/errors'

function supaErr(code: string, message = 'db error') {
  return { code, message }
}

describe('mapRpcError', () => {
  it('P0001 → not_staff 403', () => {
    const e = mapRpcError(supaErr('P0001'))
    expect(e.code).toBe('not_staff')
    expect(e.statusHint).toBe(403)
  })

  it('P0002 → not_found 404', () => {
    const e = mapRpcError(supaErr('P0002'))
    expect(e.code).toBe('not_found')
    expect(e.statusHint).toBe(404)
  })

  it('P0003 with "sold" in message → terminal_status 409 (sold variant)', () => {
    const e = mapRpcError(supaErr('P0003', 'diamond is sold'))
    expect(e.code).toBe('terminal_status')
    expect(e.message).toContain('sold')
    expect(e.statusHint).toBe(409)
  })

  it('P0003 without "sold" → terminal_status 409 (removed variant)', () => {
    const e = mapRpcError(supaErr('P0003', 'diamond is removed'))
    expect(e.code).toBe('terminal_status')
    expect(e.message).toContain('removed')
    expect(e.statusHint).toBe(409)
  })

  it('P9004 → already_in_status 409', () => {
    const e = mapRpcError(supaErr('P9004'))
    expect(e.code).toBe('already_in_status')
    expect(e.statusHint).toBe(409)
  })

  it('P0005 → invalid_transition 422', () => {
    const e = mapRpcError(supaErr('P0005'))
    expect(e.code).toBe('invalid_transition')
    expect(e.statusHint).toBe(422)
  })

  it('P0006 → insufficient_role 403', () => {
    const e = mapRpcError(supaErr('P0006'))
    expect(e.code).toBe('insufficient_role')
    expect(e.statusHint).toBe(403)
  })

  it('P0007 → hold_expiry_required 400', () => {
    expect(mapRpcError(supaErr('P0007')).code).toBe('hold_expiry_required')
  })

  it('P0008 → hold_reason_required 400', () => {
    expect(mapRpcError(supaErr('P0008')).code).toBe('hold_reason_required')
  })

  it('P0009 with "new_expiry" → expiry_must_be_future, future wording', () => {
    const e = mapRpcError(supaErr('P0009', 'new_expiry must be in the future'))
    expect(e.code).toBe('expiry_must_be_future')
    expect(e.message).toContain('New expiry')
  })

  it('P0009 without "new_expiry" → expiry_must_be_future, hold wording', () => {
    const e = mapRpcError(supaErr('P0009', 'hold expiry must be future'))
    expect(e.code).toBe('expiry_must_be_future')
    expect(e.message).toContain('Hold expiry')
  })

  it('P0010 → duration_exceeded for diamond_buyer 422', () => {
    const e = mapRpcError(supaErr('P0010'))
    expect(e.code).toBe('duration_exceeded')
    expect(e.message).toContain('7 days')
  })

  it('P0011 → duration_exceeded for sales_adviser 422', () => {
    const e = mapRpcError(supaErr('P0011'))
    expect(e.code).toBe('duration_exceeded')
    expect(e.message).toContain('48 hours')
  })

  it('P0012 → not_your_hold 403', () => {
    expect(mapRpcError(supaErr('P0012')).statusHint).toBe(403)
  })

  it('P0021 → not_your_hold 403 (extend variant)', () => {
    expect(mapRpcError(supaErr('P0021')).code).toBe('not_your_hold')
  })

  it('unknown code → unexpected_error 500', () => {
    const e = mapRpcError(supaErr('XXXXX'))
    expect(e.code).toBe('unexpected_error')
    expect(e.statusHint).toBe(500)
  })

  it('null/undefined input → unexpected_error 500', () => {
    expect(mapRpcError(null).code).toBe('unexpected_error')
    expect(mapRpcError(undefined).code).toBe('unexpected_error')
  })

  it('non-object input → unexpected_error 500', () => {
    expect(mapRpcError('something went wrong').code).toBe('unexpected_error')
  })

  it('never forwards raw message in unexpected_error', () => {
    const e = mapRpcError(supaErr('UNKNOWN', 'internal db secret details'))
    expect(e.message).not.toContain('internal db secret details')
  })
})
