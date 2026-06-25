/**
 * Phase 6 integration tests — runs against the real remote Supabase database.
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Run with: npx vitest run --config vitest.integration.config.ts
 *
 * These tests:
 *  1. Find a published, eligible diamond and a ring setting in the live DB.
 *  2. Test the full atomic reservation → cart → release cycle.
 *  3. Test cross-token protection (another cart cannot steal an active hold).
 *  4. Test expired hold reclaim (a stale hold from the same or different cart can be overwritten).
 *  5. Test the 8-point enquiry revalidation via HTTP against the running dev server.
 *  6. Confirm the diamond remains reserved (not sold) after enquiry.
 *  7. Confirm the stored enquiry configuration JSONB matches what was submitted.
 *
 * Cleanup: all holds created by these tests are released in afterAll.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// ── Configuration ─────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const APP_BASE_URL  = process.env.INTEGRATION_BASE_URL ?? 'http://localhost:3000'

const TEST_CART_TOKEN_A = `test-cart-integration-${Date.now()}-A`
const TEST_CART_TOKEN_B = `test-cart-integration-${Date.now()}-B`

// ── Admin client (service role, bypasses RLS) ─────────────────────────────────

function adminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Missing Supabase env vars — check .env.local')
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

let testDiamondId:    string
let testSettingId:    string
let testVariantId:    string
let testDiamondPrice: number  // pence
let testSettingPrice: number  // pence
let testEnquiryId:    string | null = null

beforeAll(async () => {
  const admin = adminClient()

  // Find a published, eligible, available diamond
  const { data: diamonds } = await admin
    .from('diamonds')
    .select('id, sku, price_gbp, cut, status')
    .eq('is_published', true)
    .eq('status', 'available')
    .eq('polish', 'excellent')
    .eq('symmetry', 'excellent')
    .eq('fluorescence', 'none')
    .eq('diamond_category', 'white')
    .limit(1)
    .maybeSingle()

  if (!diamonds) throw new Error('No eligible diamond found in DB — seed at least one eligible white diamond')
  testDiamondId    = diamonds.id
  testDiamondPrice = Math.round((diamonds.price_gbp as number) * 100)

  // Find a published ring setting that accepts the diamond's shape
  const { data: settings } = await admin
    .from('ring_settings')
    .select('id, base_price_gbp, diamond_shapes, metal_variants, ring_sizes, requires_ring_size_selection')
    .eq('is_published', true)
    .limit(20)

  const compatible = (settings ?? []).find(s => {
    const shapes = (s.diamond_shapes as string[]) ?? []
    return shapes.includes(diamonds.cut)
  })
  if (!compatible) throw new Error(`No ring setting supports shape '${diamonds.cut}' — ensure at least one published setting includes it in diamond_shapes`)
  testSettingId = compatible.id

  // Find a published, enabled metal variant
  let variants: { id: string; metal: string; enabled: boolean; price?: number }[] = []
  try {
    variants = JSON.parse(compatible.metal_variants as string)
  } catch {
    variants = (compatible.metal_variants as typeof variants) ?? []
  }
  const enabledVariant = variants.find(v => v.enabled)
  if (!enabledVariant) throw new Error('Ring setting has no enabled metal variants')
  testVariantId    = enabledVariant.id
  testSettingPrice = Math.round(((enabledVariant.price ?? (compatible.base_price_gbp as number)) ?? 0) * 100)
})

afterAll(async () => {
  const admin = adminClient()
  // Release both test cart holds if they weren't cleaned up
  if (testDiamondId) {
    await admin
      .from('diamonds')
      .update({ status: 'available', held_until: null, held_by_cart: null })
      .eq('id', testDiamondId)
      .or(`held_by_cart.eq.${TEST_CART_TOKEN_A},held_by_cart.eq.${TEST_CART_TOKEN_B}`)
  }
  // Delete any test enquiries
  if (testEnquiryId) {
    await admin.from('enquiries').delete().eq('id', testEnquiryId)
  }
})

// ── 1. Atomic claim ────────────────────────────────────────────────────────────

describe('1. Atomic reservation', () => {
  it('1a. Cart A can claim an available diamond', async () => {
    const admin    = adminClient()
    const now      = new Date().toISOString()
    const expiry   = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { data } = await admin
      .from('diamonds')
      .update({ status: 'reserved', held_until: expiry, held_by_cart: TEST_CART_TOKEN_A })
      .eq('id', testDiamondId)
      .eq('is_published', true)
      .or(`status.eq.available,and(status.eq.reserved,held_until.lt.${now})`)
      .select('id, status, held_by_cart, held_until')
      .maybeSingle()

    expect(data).not.toBeNull()
    expect(data!.status).toBe('reserved')
    expect(data!.held_by_cart).toBe(TEST_CART_TOKEN_A)
    expect(new Date(data!.held_until as string).getTime()).toBeGreaterThan(Date.now())
  })

  it('1b. Cart B cannot claim the same diamond while Cart A holds it', async () => {
    const admin  = adminClient()
    const now    = new Date().toISOString()
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { data } = await admin
      .from('diamonds')
      .update({ status: 'reserved', held_until: expiry, held_by_cart: TEST_CART_TOKEN_B })
      .eq('id', testDiamondId)
      .eq('is_published', true)
      .or(`status.eq.available,and(status.eq.reserved,held_until.lt.${now})`)
      .select('id')
      .maybeSingle()

    // Zero rows = already held by another cart
    expect(data).toBeNull()

    // Confirm held_by_cart is still Cart A
    const { data: check } = await admin
      .from('diamonds')
      .select('held_by_cart')
      .eq('id', testDiamondId)
      .maybeSingle()
    expect(check!.held_by_cart).toBe(TEST_CART_TOKEN_A)
  })

  it('1c. Release via /api/rings/release is ownership-scoped (wrong token is a no-op)', async () => {
    const res = await fetch(`${APP_BASE_URL}/api/rings/release`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ diamondId: testDiamondId, cartToken: TEST_CART_TOKEN_B }),
    })
    expect(res.ok).toBe(true)  // Always returns ok:true (fire-and-forget)

    // Confirm diamond still held by Cart A
    const admin = adminClient()
    const { data } = await admin
      .from('diamonds')
      .select('held_by_cart, status')
      .eq('id', testDiamondId)
      .maybeSingle()
    expect(data!.status).toBe('reserved')
    expect(data!.held_by_cart).toBe(TEST_CART_TOKEN_A)
  })

  it('1d. Cart A can release its own hold', async () => {
    const res = await fetch(`${APP_BASE_URL}/api/rings/release`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ diamondId: testDiamondId, cartToken: TEST_CART_TOKEN_A }),
    })
    expect(res.ok).toBe(true)

    const admin = adminClient()
    const { data } = await admin
      .from('diamonds')
      .select('status, held_by_cart, held_until')
      .eq('id', testDiamondId)
      .maybeSingle()

    expect(data!.status).toBe('available')
    expect(data!.held_by_cart).toBeNull()
    expect(data!.held_until).toBeNull()
  })

  it('1e. Expired hold can be reclaimed by a new cart', async () => {
    const admin = adminClient()
    // Manually insert an expired hold (1 second in the past)
    await admin
      .from('diamonds')
      .update({
        status:       'reserved',
        held_until:   new Date(Date.now() - 1000).toISOString(),
        held_by_cart: 'expired-cart-token',
      })
      .eq('id', testDiamondId)

    // Now claim it as Cart B — should succeed because hold has expired
    const now    = new Date().toISOString()
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { data } = await admin
      .from('diamonds')
      .update({ status: 'reserved', held_until: expiry, held_by_cart: TEST_CART_TOKEN_B })
      .eq('id', testDiamondId)
      .or(`status.eq.available,and(status.eq.reserved,held_until.lt.${now})`)
      .select('id, held_by_cart')
      .maybeSingle()

    expect(data).not.toBeNull()
    expect(data!.held_by_cart).toBe(TEST_CART_TOKEN_B)

    // Cleanup: release this hold
    await admin
      .from('diamonds')
      .update({ status: 'available', held_until: null, held_by_cart: null })
      .eq('id', testDiamondId)
      .eq('held_by_cart', TEST_CART_TOKEN_B)
  })

  it('1f. Sold diamond cannot be claimed', async () => {
    const admin = adminClient()
    // Mark as sold
    await admin.from('diamonds').update({ status: 'sold' }).eq('id', testDiamondId)

    const now    = new Date().toISOString()
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    const { data } = await admin
      .from('diamonds')
      .update({ status: 'reserved', held_until: expiry, held_by_cart: TEST_CART_TOKEN_A })
      .eq('id', testDiamondId)
      .or(`status.eq.available,and(status.eq.reserved,held_until.lt.${now})`)
      .select('id')
      .maybeSingle()

    expect(data).toBeNull()

    // Restore to available
    await admin.from('diamonds').update({ status: 'available' }).eq('id', testDiamondId)
  })
})

// ── 2. Release endpoint ────────────────────────────────────────────────────────

describe('2. Release endpoint', () => {
  it('2a. Invalid UUID returns 400', async () => {
    const res = await fetch(`${APP_BASE_URL}/api/rings/release`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ diamondId: 'not-a-uuid', cartToken: TEST_CART_TOKEN_A }),
    })
    expect(res.status).toBe(400)
  })

  it('2b. Missing body returns 400', async () => {
    const res = await fetch(`${APP_BASE_URL}/api/rings/release`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('2c. Release of non-existent hold returns ok:true (fire-and-forget)', async () => {
    const res = await fetch(`${APP_BASE_URL}/api/rings/release`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        diamondId: '00000000-0000-4000-a000-000000000000',
        cartToken: TEST_CART_TOKEN_A,
      }),
    })
    expect(res.ok).toBe(true)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })
})

// ── 3. Enquiry revalidation ───────────────────────────────────────────────────

describe('3. Enquiry 8-point revalidation', () => {
  const ringConfig = {
    settingId:            '',   // filled in beforeAll
    settingName:          'Test Setting',
    settingSlug:          'test-setting',
    metalVariantId:       '',   // filled in beforeAll
    metal:                'platinum',
    metalLabel:           'Platinum',
    diamondId:            '',   // filled in beforeAll
    diamondSku:           'EGD-TEST',
    diamondDescription:   '1.00ct Round · D · FL',
    diamondCategory:      'white' as const,
    diamondShape:         'round',
    diamondCarat:         1,
    ringSize:             null,
    settingPrice:         0,    // pence — filled in beforeAll
    diamondPrice:         0,    // pence — filled in beforeAll
    totalPrice:           0,    // pence — filled in beforeAll
    reservationExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  }

  beforeAll(async () => {
    ringConfig.settingId      = testSettingId
    ringConfig.metalVariantId = testVariantId
    ringConfig.diamondId      = testDiamondId
    ringConfig.settingPrice   = testSettingPrice
    ringConfig.diamondPrice   = testDiamondPrice
    ringConfig.totalPrice     = testSettingPrice + testDiamondPrice

    // Claim the diamond for Cart A
    const admin  = adminClient()
    const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    await admin
      .from('diamonds')
      .update({ status: 'reserved', held_until: expiry, held_by_cart: TEST_CART_TOKEN_A })
      .eq('id', testDiamondId)
  })

  it('3a. Enquiry rejected if diamond held by different cart token', async () => {
    const res = await fetch(`${APP_BASE_URL}/api/enquiry`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:      'Test Customer',
        email:     'test@integration.test',
        message:   'Integration test enquiry — wrong token.',
        ringConfig,
        cartToken: TEST_CART_TOKEN_B,  // Wrong token
      }),
    })
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(json.error).toBeTruthy()
  })

  it('3b. Enquiry rejected if price integrity fails', async () => {
    const tampered = { ...ringConfig, totalPrice: ringConfig.totalPrice + 1 }
    const res = await fetch(`${APP_BASE_URL}/api/enquiry`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:      'Test Customer',
        email:     'test@integration.test',
        message:   'Integration test enquiry — tampered price.',
        ringConfig: tampered,
        cartToken: TEST_CART_TOKEN_A,
      }),
    })
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(json.error).toContain('price')
  })

  it('3c. Valid enquiry with correct token and price is accepted', async () => {
    const res = await fetch(`${APP_BASE_URL}/api/enquiry`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:      'Integration Test',
        email:     'integration@test.invalid',
        message:   'Phase 6 integration test — valid enquiry.',
        ringConfig,
        cartToken: TEST_CART_TOKEN_A,
      }),
    })
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
  })

  it('3d. Diamond remains RESERVED after enquiry (not sold)', async () => {
    const admin = adminClient()
    const { data } = await admin
      .from('diamonds')
      .select('status, held_by_cart')
      .eq('id', testDiamondId)
      .maybeSingle()

    expect(data!.status).toBe('reserved')
    expect(data!.held_by_cart).toBe(TEST_CART_TOKEN_A)
  })

  it('3e. Enquiry stored in DB with full configuration JSONB', async () => {
    const admin = adminClient()
    const { data } = await admin
      .from('enquiries')
      .select('id, configuration, ring_setting_id, diamond_id, metal')
      .eq('customer_email', 'integration@test.invalid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    expect(data).not.toBeNull()
    testEnquiryId = data!.id

    expect(data!.ring_setting_id).toBe(testSettingId)
    expect(data!.diamond_id).toBe(testDiamondId)
    expect(data!.metal).toBeTruthy()

    const config = data!.configuration as Record<string, unknown>
    expect(config).not.toBeNull()
    expect(config.settingId).toBe(testSettingId)
    expect(config.diamondId).toBe(testDiamondId)
    expect(config.settingPrice).toBe(testSettingPrice)
    expect(config.diamondPrice).toBe(testDiamondPrice)
    expect(config.totalPrice).toBe(testSettingPrice + testDiamondPrice)
    // Confirm no internal audit fields are stored
    expect(config).not.toHaveProperty('eclat_approved')
    expect(config).not.toHaveProperty('held_by_cart')
    expect(config).not.toHaveProperty('origin')
    expect(config).not.toHaveProperty('lab')
  })
})

// ── 4. Diamond columns confirmed ──────────────────────────────────────────────
//
// information_schema is not exposed via PostgREST (not in supabase config schemas).
// Instead we verify existence by selecting each column directly — PostgREST returns
// error code 42703 ("column does not exist") if the column is absent, or an empty
// array with no error if it exists.  Type correctness is enforced by the migration
// (0027) and by tests 1a–1e which read/write these columns successfully.

describe('4. DB schema — migration 0027', () => {
  it('4a. diamonds.held_until column exists and is accessible via PostgREST', async () => {
    const admin = adminClient()
    const { error } = await admin
      .from('diamonds')
      .select('held_until')
      .limit(0)

    expect(error).toBeNull()
  })

  it('4b. diamonds.held_by_cart column exists and is accessible via PostgREST', async () => {
    const admin = adminClient()
    const { error } = await admin
      .from('diamonds')
      .select('held_by_cart')
      .limit(0)

    expect(error).toBeNull()
  })

  it('4c. enquiries.configuration column exists and is accessible via PostgREST', async () => {
    const admin = adminClient()
    const { error } = await admin
      .from('enquiries')
      .select('configuration')
      .limit(0)

    expect(error).toBeNull()
  })
})
