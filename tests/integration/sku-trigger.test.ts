/**
 * Integration test: diamond SKU trigger (migrations 0013 + 0014).
 *
 * Requires ALL of the following to run:
 *   RUN_LOCAL_SUPABASE_INTEGRATION=true   (explicit opt-in flag)
 *   SUPABASE_SERVICE_ROLE_KEY             (local service-role key)
 *   SUPABASE_URL                          (defaults to http://127.0.0.1:54321)
 *
 * The suite REFUSES to run against any non-localhost URL to prevent
 * accidental execution against a remote / production Supabase project.
 *
 * Run: npm run test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// ── Local-only safety guard ───────────────────────────────────────────────────

const OPT_IN         = process.env.RUN_LOCAL_SUPABASE_INTEGRATION === 'true'
const SUPABASE_URL   = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY       = process.env.SUPABASE_ANON_KEY ?? ''

function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
  } catch {
    return false
  }
}

// Fail immediately — before any DB connection — if a remote URL is detected.
if (OPT_IN && !isLocalUrl(SUPABASE_URL)) {
  throw new Error(
    `[integration] REFUSED: SUPABASE_URL "${SUPABASE_URL}" is not a localhost address. ` +
    'Integration tests must only run against a local Supabase instance.',
  )
}

const shouldRun = OPT_IN && !!SERVICE_KEY && isLocalUrl(SUPABASE_URL)

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_INSERT = {
  origin:                 'natural',
  colour_category:        'standard',
  colour_grade:           'G',
  shape:                  'round',
  carat:                  '1.000',
  clarity:                'VS1',
  polish:                 'Excellent',
  symmetry:               'Very Good',
  fluorescence:           'None',
  retail_price_currency:  'AED',
  supplier_cost_currency: 'USD',
}

const insertedIds: string[] = []

// ── Suite ─────────────────────────────────────────────────────────────────────

describe.skipIf(!shouldRun)('SKU trigger — integration (local only)', () => {
  let admin: ReturnType<typeof createClient>
  let anon:  ReturnType<typeof createClient>

  beforeAll(() => {
    admin = createClient(SUPABASE_URL, SERVICE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    if (ANON_KEY) {
      anon = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
  })

  afterAll(async () => {
    if (!admin || insertedIds.length === 0) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('diamonds') as any).delete().in('id', insertedIds)
  })

  // ── SKU assignment ──────────────────────────────────────────────────────────

  it('assigns EGD-{YYYY}-{NNNNNN} SKU on insert when sku is null', async () => {
    const year = new Date().getUTCFullYear()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from('diamonds') as any)
      .insert({ ...BASE_INSERT })
      .select('id, sku')
      .single() as { data: { id: string; sku: string } | null; error: unknown }

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    insertedIds.push(data!.id)
    expect(data!.sku).toMatch(new RegExp(`^EGD-${year}-\\d{6}$`))
  })

  it('SKU counter increments for a second insert in the same year', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin.from('diamonds') as any
    const { data: d1, error: e1 } = await db.insert({ ...BASE_INSERT }).select('id, sku').single() as { data: { id: string; sku: string } | null; error: unknown }
    expect(e1).toBeNull()
    insertedIds.push(d1!.id)

    const { data: d2, error: e2 } = await db.insert({ ...BASE_INSERT }).select('id, sku').single() as { data: { id: string; sku: string } | null; error: unknown }
    expect(e2).toBeNull()
    insertedIds.push(d2!.id)

    const n1 = parseInt(d1!.sku.split('-')[2], 10)
    const n2 = parseInt(d2!.sku.split('-')[2], 10)
    expect(n2).toBe(n1 + 1)
  })

  it('explicit SKU in INSERT is preserved (no override)', async () => {
    const manualSku = 'EGD-TEST-MANUAL'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.from('diamonds') as any)
      .insert({ ...BASE_INSERT, sku: manualSku })
      .select('id, sku')
      .single() as { data: { id: string; sku: string } | null; error: unknown }
    expect(error).toBeNull()
    insertedIds.push(data!.id)
    expect(data!.sku).toBe(manualSku)
  })

  // ── SKU immutability (migration 0014 enforcement) ───────────────────────────

  it('updating sku to a different value is rejected with P9005', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin.from('diamonds') as any
    const { data: created } = await db.insert({ ...BASE_INSERT }).select('id, sku').single() as { data: { id: string; sku: string } | null; error: unknown }
    insertedIds.push(created!.id)

    const { error } = await db
      .update({ sku: 'EGD-TAMPERED-000001' })
      .eq('id', created!.id)
      .select('id')
      .single() as { data: unknown; error: { code?: string; message?: string } | null }

    // PostgREST surfaces the SQLSTATE as error.code
    expect(error).not.toBeNull()
    expect(error!.code).toBe('P9005')
  })

  it('updating a non-SKU field while SKU is unchanged succeeds', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin.from('diamonds') as any
    const { data: created } = await db.insert({ ...BASE_INSERT }).select('id, sku').single() as { data: { id: string; sku: string } | null; error: unknown }
    insertedIds.push(created!.id)

    const { data: updated, error } = await db
      .update({ selection_note: 'updated safely' })
      .eq('id', created!.id)
      .select('id, sku, selection_note')
      .single() as { data: { id: string; sku: string; selection_note: string } | null; error: unknown }

    expect(error).toBeNull()
    expect(updated!.sku).toBe(created!.sku)
    expect(updated!.selection_note).toBe('updated safely')
  })

  // ── diamond_sku_counters access control (migration 0014 RLS) ────────────────

  it('anon role cannot read diamond_sku_counters', async () => {
    if (!anon) {
      console.warn('Skipping anon test — SUPABASE_ANON_KEY not set')
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (anon.from('diamond_sku_counters') as any)
      .select('*') as { data: unknown; error: unknown }

    // With RLS enabled and no policies, anon should get either an error or empty result.
    // PostgREST returns 42501 (insufficient_privilege) or an empty array depending on version.
    const isEmpty = Array.isArray(data) && data.length === 0
    const isError = error !== null
    expect(isEmpty || isError).toBe(true)
  })

  // ── Trigger inventory ───────────────────────────────────────────────────────

  it('exactly one BEFORE INSERT SKU trigger exists on diamonds', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.rpc as any)('execute_sql', {
      sql: `
        SELECT trigger_name
        FROM   information_schema.triggers
        WHERE  event_object_schema = 'public'
        AND    event_object_table  = 'diamonds'
        AND    action_timing       = 'BEFORE'
        AND    event_manipulation  = 'INSERT'
      `,
    }) as { data: { trigger_name: string }[] | null; error: { message?: string } | null }
    if (error?.message?.includes('function execute_sql')) {
      console.warn('Skipping trigger inventory — execute_sql RPC not available')
      return
    }
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].trigger_name).toBe('trg_assign_diamond_sku')
  })

  it('exactly one BEFORE UPDATE SKU trigger exists on diamonds', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.rpc as any)('execute_sql', {
      sql: `
        SELECT trigger_name
        FROM   information_schema.triggers
        WHERE  event_object_schema = 'public'
        AND    event_object_table  = 'diamonds'
        AND    action_timing       = 'BEFORE'
        AND    event_manipulation  = 'UPDATE'
      `,
    }) as { data: { trigger_name: string }[] | null; error: { message?: string } | null }
    if (error?.message?.includes('function execute_sql')) {
      console.warn('Skipping trigger inventory — execute_sql RPC not available')
      return
    }
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].trigger_name).toBe('trg_reject_diamond_sku_change')
  })

  it('old SKU artifacts from 0006 no longer exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.rpc as any)('execute_sql', {
      sql: `
        SELECT
          (SELECT COUNT(*) FROM information_schema.triggers
           WHERE event_object_table = 'diamonds'
           AND   trigger_name = 'trg_diamonds_generate_sku')          AS old_trigger,
          (SELECT COUNT(*) FROM information_schema.routines
           WHERE routine_schema = 'public'
           AND   routine_name   = 'generate_diamond_sku')             AS old_fn,
          (SELECT COUNT(*) FROM information_schema.sequences
           WHERE sequence_schema = 'public'
           AND   sequence_name   = 'diamonds_sku_seq')                AS old_seq
      `,
    }) as { data: { old_trigger: string; old_fn: string; old_seq: string }[] | null; error: { message?: string } | null }
    if (error?.message?.includes('function execute_sql')) {
      console.warn('Skipping artifact check — execute_sql RPC not available')
      return
    }
    expect(error).toBeNull()
    const row = data![0]
    expect(Number(row.old_trigger)).toBe(0)
    expect(Number(row.old_fn)).toBe(0)
    expect(Number(row.old_seq)).toBe(0)
  })
})

// ── Local-only guard unit test (always runs, no DB required) ──────────────────

describe('integration safety guard', () => {
  it('rejects a remote Supabase URL before connecting', () => {
    const remoteUrl = 'https://abcdefgh.supabase.co'
    expect(isLocalUrl(remoteUrl)).toBe(false)
  })

  it('accepts localhost URLs', () => {
    expect(isLocalUrl('http://localhost:54321')).toBe(true)
    expect(isLocalUrl('http://127.0.0.1:54321')).toBe(true)
  })

  it('skips the suite when RUN_LOCAL_SUPABASE_INTEGRATION is absent', () => {
    // The shouldRun flag is false in the unit test environment (no opt-in env).
    // This test verifies the flag logic without triggering DB calls.
    const flagMissing = process.env.RUN_LOCAL_SUPABASE_INTEGRATION !== 'true'
    // In CI / normal unit test run, this will be true.
    expect(typeof shouldRun).toBe('boolean')
    if (flagMissing) {
      expect(shouldRun).toBe(false)
    }
  })
})
