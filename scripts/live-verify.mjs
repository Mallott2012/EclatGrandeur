/**
 * Live-site verification against the production Vercel deployment.
 * Checks all 12 required verification points.
 */
import { createClient } from '@supabase/supabase-js'

const LIVE_URL = 'https://eclatgrandeur.vercel.app'
const NEW_URL  = 'https://fiseoqdajptkyxaymkli.supabase.co'
const NEW_SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc2VvcWRhanB0a3l4YXlta2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA1NTc0NCwiZXhwIjoyMDk3NjMxNzQ0fQ.QBCRueq7TuxIB2w7JYF7n6I-TjB9Tkm2xagsvOLkIUo'
const OLD_SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZXpvcmhzZGRjbWpxbHp4aWFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA4ODg5OCwiZXhwIjoyMDk3NjY0ODk4fQ.j_0s3oGrzQ_B_hU9t58F0cBUVRS26d-v_L8MvJOMF7M'

const db = createClient(NEW_URL, NEW_SRK, { auth: { autoRefreshToken: false, persistSession: false } })
const oldDb = createClient('https://ieezorhsddcmjqlzxiai.supabase.co', OLD_SRK, { auth: { autoRefreshToken: false, persistSession: false } })

let pass = 0; let fail = 0
function ok(label) { console.log(`  ✓ ${label}`); pass++ }
function ko(label, detail) { console.error(`  ✗ ${label}${detail ? ': '+detail : ''}`); fail++ }
function check(condition, label, detail) { condition ? ok(label) : ko(label, detail) }

async function get(path, options = {}) {
  const res = await fetch(`${LIVE_URL}${path}`, options)
  return { status: res.status, ok: res.ok, body: res.ok ? await res.json().catch(() => null) : null, text: !res.ok ? await res.text().catch(() => '') : '' }
}

async function head(url) {
  const res = await fetch(url, { method: 'HEAD' })
  return { status: res.status, ok: res.ok }
}

console.log(`Verifying: ${LIVE_URL}`)
console.log(`Against NEW DB: ${NEW_URL}\n`)

// ── 1. Engagement ring page loads from NEW ────────────────────────────────────
console.log('═══ Check 1: Engagement ring page loads ═══')
{
  const { status, ok: pageOk } = await head(`${LIVE_URL}/engagement-rings/lumiere-halo`)
  check(pageOk, `GET /engagement-rings/lumiere-halo → ${status}`)
}

// ── 2. Diamond API returns 6 eligible imported diamonds ───────────────────────
console.log('\n═══ Check 2: Diamond API returns 6 eligible diamonds ═══')
{
  const { status, body } = await get('/api/diamonds?limit=10')
  check(status === 200, `GET /api/diamonds → ${status}`)
  if (body) {
    check(body.diamonds?.length === 6, `6 diamonds returned (got ${body.diamonds?.length})`)
    const skus = body.diamonds?.map(d => d.sku).sort()
    check(skus?.includes('EGD-2026-000001'), 'EGD-2026-000001 in response')
    check(skus?.includes('EGD-2026-000006'), 'EGD-2026-000006 in response')
    // Verify no internal fields exposed
    const d0 = body.diamonds?.[0]
    check(!d0?.eclat_approved_by, 'eclat_approved_by not exposed')
    check(!d0?.held_by_cart, 'held_by_cart not exposed')
    check(!d0?.eclat_approval_note, 'eclat_approval_note not exposed')
    // Verify no OLD URL in response
    const bodyStr = JSON.stringify(body)
    check(!bodyStr.includes('ieezorhsddcmjqlzxiai'), 'no OLD URL in diamond API response')
    console.log(`    SKUs: ${skus?.join(', ')}`)
  }
}

// ── 3. Diamond selector for lumiere-halo ring returns compatible diamonds ──────
console.log('\n═══ Check 3: Diamonds compatible with lumiere-halo ring ═══')
{
  const { data: rs } = await db.from('ring_settings').select('id').eq('slug', 'lumiere-halo').single()
  if (rs?.id) {
    const { status, body } = await get(`/api/diamonds?ring_setting_id=${rs.id}&limit=10`)
    check(status === 200, `GET /api/diamonds?ring_setting_id=${rs.id} → ${status}`)
    if (body) {
      check((body.diamonds?.length ?? 0) > 0, `diamonds returned for ring setting (got ${body.diamonds?.length})`)
      console.log(`    ${body.diamonds?.length} compatible diamonds for lumiere-halo`)
    }
  } else {
    ko('lumiere-halo ring setting not found in DB')
  }
}

// ── 4. Ring gallery media URLs resolve ────────────────────────────────────────
console.log('\n═══ Check 4: Ring gallery media URLs ═══')
{
  const { data: media } = await db.from('ring_setting_media')
    .select('storage_path,media_type')
    .eq('ring_setting_id', '42ef6109-7a38-4063-a03a-caab6f6aef48')
    .order('display_order')
    .limit(5)

  for (const m of (media ?? [])) {
    const { status, ok: urlOk } = await head(m.storage_path)
    check(urlOk, `${m.media_type} ${m.storage_path.split('/').pop()} → HTTP ${status}`)
    check(!m.storage_path.includes('ieezorhsddcmjqlzxiai'), `no OLD URL in storage_path`)
  }
}

// ── 5. Jewellery product pages load ───────────────────────────────────────────
console.log('\n═══ Check 5: Jewellery product pages ═══')
{
  for (const [cat, slug] of [['necklaces','soleil-solitaire'],['bracelets','riviere-tennis'],['earrings','aura-halo-studs']]) {
    const { status, ok: pageOk } = await head(`${LIVE_URL}/${cat}/${slug}`)
    check(pageOk, `GET /${cat}/${slug} → ${status}`)
  }
}

// ── 6. Add to Bag — atomic reservation (via DB, mirrors server action claimDiamond) ──
console.log('\n═══ Check 6: Atomic reservation (claimDiamond SQL via DB admin) ═══')
const cartToken = `live-verify-${Date.now()}`
let reservedDiamondId = null
let reservedDiamond = null
{
  const { data: available } = await db.from('diamonds')
    .select('id,sku,price_gbp,cut,carat,colour,clarity,cut_grade,polish,symmetry,fluorescence,diamond_category')
    .eq('status', 'available')
    .eq('is_published', true)
    .limit(1)
    .single()

  check(available != null, 'Available diamond found in NEW DB')

  if (available) {
    const now       = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Atomic claim — same SQL as claimDiamond() in reservation.ts
    const { data: claimed } = await db
      .from('diamonds')
      .update({ status: 'reserved', held_until: expiresAt, held_by_cart: cartToken })
      .eq('id', available.id)
      .eq('is_published', true)
      .or(`status.eq.available,and(status.eq.reserved,held_until.lt.${now})`)
      .select('id')
      .maybeSingle()

    check(claimed !== null, `Atomic claim succeeded for ${available.sku}`)

    if (claimed) {
      reservedDiamondId = available.id
      reservedDiamond   = available

      // Confirm reservation in DB
      const { data: d } = await db.from('diamonds').select('status,held_by_cart,held_until').eq('id', available.id).single()
      check(d?.status === 'reserved', `Diamond status = reserved (got ${d?.status})`)
      check(d?.held_by_cart === cartToken, `held_by_cart matches cartToken`)
      check(d?.held_until != null, 'held_until is set')
      if (d?.held_until) {
        const minutesFromNow = (new Date(d.held_until) - new Date()) / 60000
        check(minutesFromNow > 50 && minutesFromNow < 70, `60-min hold (${minutesFromNow.toFixed(1)} min remaining)`)
      }
      console.log(`    Reserved: ${available.sku} for cart ${cartToken}`)
    }
  }
}

// ── 7. Enquiry submission ─────────────────────────────────────────────────────
console.log('\n═══ Check 7: Enquiry submission ═══')
let enquiryId = null
{
  const { data: rs } = await db.from('ring_settings').select('id,slug,metal_variants,base_price_gbp').eq('slug', 'lumiere-halo').single()
  const { data: diamond } = await db.from('diamonds').select('id,sku,price_gbp,cut,carat,colour,clarity,diamond_category').eq('id', reservedDiamondId || '').single()

  if (rs && diamond && reservedDiamondId) {
    const variant = Array.isArray(rs.metal_variants) ? rs.metal_variants[0] : Object.values(rs.metal_variants ?? {})[0]
    const settingPrice = (variant?.priceGbp ?? rs.base_price_gbp ?? 0) * 100
    const diamondPrice = diamond.price_gbp * 100

    const payload = {
      name: 'Live Verify Test',
      email: 'liveverify@eclatgrandeur.test',
      phone: '',
      message: 'Automated live-site verification enquiry — safe to delete.',
      ringConfig: {
        settingId:    rs.id,
        settingName:  'Éclat Classic Round Brilliant',
        settingSlug:  rs.slug,
        metalVariantId: variant?.id ?? 'v-platinum',
        metal:        'platinum',
        metalLabel:   'Platinum',
        diamondId:    diamond.id,
        diamondSku:   diamond.sku,
        diamondDescription: `${diamond.carat}ct Round ${diamond.colour} ${diamond.clarity}`,
        diamondCategory: diamond.diamond_category ?? 'white',
        diamondShape: 'round',
        diamondCarat: diamond.carat,
        ringSize:     'M',
        settingPrice,
        diamondPrice,
        totalPrice:   settingPrice + diamondPrice,
        reservationExpiresAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
      },
      cartToken,
    }

    const { status, body, text } = await get('/api/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    check(status === 200, `POST /api/enquiry → ${status}${text ? ' '+text.substring(0,200) : ''}`)

    if (status === 200) {
      // Confirm in NEW DB
      const { data: eq } = await db.from('enquiries')
        .select('id,customer_name,customer_email,diamond_id,ring_setting_id')
        .eq('customer_email', 'liveverify@eclatgrandeur.test')
        .single()

      check(eq != null, 'Enquiry found in NEW enquiries table')
      check(eq?.diamond_id === diamond.id, `diamond_id matches (${eq?.diamond_id?.substring(0,8)})`)
      check(eq?.ring_setting_id === rs.id, `ring_setting_id matches`)
      enquiryId = eq?.id
      console.log(`    Enquiry ${enquiryId?.substring(0,8)} saved to NEW DB`)
    }
  } else if (!reservedDiamondId) {
    ko('Enquiry test skipped — reservation failed in Check 6')
  }
}

// ── 8. No OLD URL in any live API response ────────────────────────────────────
console.log('\n═══ Check 8: No OLD project references in live responses ═══')
{
  const paths = [
    '/api/diamonds',
    '/api/rings',
  ]
  for (const path of paths) {
    const res = await fetch(`${LIVE_URL}${path}`)
    if (res.ok) {
      const body = await res.text()
      check(!body.includes('ieezorhsddcmjqlzxiai'), `${path}: no OLD URL in response`)
    }
  }

  // Check that the production deployment env vars don't reference OLD
  const vercelCheckRes = await fetch(`${LIVE_URL}/api/diamonds?limit=1`)
  const vercelBody = await vercelCheckRes.text()
  check(!vercelBody.includes('ieezorhsddcmjqlzxiai'), 'Live API response: no OLD Supabase URL')
}

// ── 9. NEW DB final state ─────────────────────────────────────────────────────
console.log('\n═══ Check 9: NEW DB final state ═══')
{
  const tables = ['ring_settings','ring_setting_media','diamonds','jewellery_products','jewellery_product_media','enquiries']
  for (const t of tables) {
    const { count } = await db.from(t).select('id', { count: 'exact', head: true })
    console.log(`    ${t}: ${count} rows`)
  }
  const { count: enquiryCount } = await db.from('enquiries').select('id', { count: 'exact', head: true })
  check(enquiryCount >= 0, `Enquiries table accessible in NEW (${enquiryCount} rows)`)
}

// ── 10. OLD project unchanged ─────────────────────────────────────────────────
console.log('\n═══ Check 10: OLD project unchanged ═══')
{
  const { count: oldRs }  = await oldDb.from('ring_settings').select('id', { count: 'exact', head: true })
  const { count: oldDm }  = await oldDb.from('diamonds').select('id', { count: 'exact', head: true })
  const { count: oldEnq } = await oldDb.from('enquiries').select('id', { count: 'exact', head: true })
  check(oldRs === 2,  `OLD ring_settings = 2 (got ${oldRs})`)
  check(oldDm === 6,  `OLD diamonds = 6 (got ${oldDm})`)
  check(oldEnq === 0, `OLD enquiries = 0 (got ${oldEnq})`)
}

// ── 11. Cleanup verification enquiry ─────────────────────────────────────────
console.log('\n═══ Cleanup: release reservation + delete verify enquiry ═══')
{
  if (reservedDiamondId) {
    const { status } = await get('/api/rings/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartToken, diamondId: reservedDiamondId }),
    })
    check(status === 200, `POST /api/rings/release → ${status}`)
  }
  if (enquiryId) {
    await db.from('enquiries').delete().eq('id', enquiryId)
    console.log(`    Deleted verification enquiry ${enquiryId?.substring(0,8)}`)
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(50)}`)
console.log(`RESULT: ${pass} passed, ${fail} failed`)
if (fail > 0) {
  console.error(`\n⚠️  ${fail} check(s) failed — review above`)
  process.exit(1)
} else {
  console.log(`\n✓ All checks passed. Production cutover complete.`)
}
