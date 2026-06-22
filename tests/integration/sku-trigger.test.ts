/**
 * Integration test: diamond SKU trigger (migration 0013).
 *
 * Requires a running local Supabase instance with migrations applied.
 * Run via: npm run test:integration
 *
 * Environment variable required: SUPABASE_SERVICE_ROLE_KEY
 * Uses the local Supabase URL (http://127.0.0.1:54321).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = process.env.SUPABASE_URL      ?? 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

const SUPPLIER_ID_PLACEHOLDER = '00000000-0000-0000-0000-000000000001'

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

// Inserted IDs collected for cleanup.
const insertedIds: string[] = []

describe.skipIf(!SERVICE_ROLE_KEY)('SKU trigger — integration', () => {
  let admin: ReturnType<typeof createClient>

  beforeAll(() => {
    if (!SERVICE_ROLE_KEY) return
    admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  })

  afterAll(async () => {
    if (!admin || insertedIds.length === 0) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from('diamonds') as any).delete().in('id', insertedIds)
  })

  it('assigns EGD-{YYYY}-{NNNNNN} SKU on insert when sku is null', async () => {
    const year = new Date().getFullYear()
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

  it('SKU is immutable — UPDATE does not change it', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin.from('diamonds') as any
    const { data: created, error: insertErr } = await db.insert({ ...BASE_INSERT }).select('id, sku').single() as { data: { id: string; sku: string } | null; error: unknown }
    expect(insertErr).toBeNull()
    insertedIds.push(created!.id)

    const originalSku = created!.sku

    const { data: updated, error: updateErr } = await db.update({ selection_note: 'test immutability' }).eq('id', created!.id).select('id, sku').single() as { data: { id: string; sku: string } | null; error: unknown }
    expect(updateErr).toBeNull()
    expect(updated!.sku).toBe(originalSku)
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

  it('exactly one BEFORE INSERT trigger fires (no duplicate SKU per insert)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin.rpc as any)('execute_sql', {
      sql: `
        SELECT COUNT(*) AS cnt
        FROM   information_schema.triggers
        WHERE  event_object_table = 'diamonds'
        AND    trigger_name LIKE '%sku%'
        AND    action_timing = 'BEFORE'
        AND    event_manipulation = 'INSERT'
      `,
    }) as { data: unknown; error: { message?: string } | null }
    if ((error as { message?: string } | null)?.message?.includes('function execute_sql')) {
      console.warn('Skipping trigger count check — execute_sql RPC not available')
      return
    }
    expect(error).toBeNull()
    expect(Number((data as { cnt: string }[] | null | undefined)?.[0]?.cnt)).toBe(1)
  })
})
