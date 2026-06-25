/**
 * Production data migration: OLD ieezorhsddcmjqlzxiai → NEW fiseoqdajptkyxaymkli
 *
 * RULES:
 * - Read-only from OLD — zero mutations to ieezorhsddcmjqlzxiai
 * - Upserts / deletes only on NEW fiseoqdajptkyxaymkli
 * - Abort on any error (throw)
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ── Credentials ───────────────────────────────────────────────────────────────
const OLD_URL = 'https://ieezorhsddcmjqlzxiai.supabase.co'
const OLD_SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZXpvcmhzZGRjbWpxbHp4aWFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA4ODg5OCwiZXhwIjoyMDk3NjY0ODk4fQ.j_0s3oGrzQ_B_hU9t58F0cBUVRS26d-v_L8MvJOMF7M'

const NEW_URL = 'https://fiseoqdajptkyxaymkli.supabase.co'
const NEW_SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc2VvcWRhanB0a3l4YXlta2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA1NTc0NCwiZXhwIjoyMDk3NjMxNzQ0fQ.QBCRueq7TuxIB2w7JYF7n6I-TjB9Tkm2xagsvOLkIUo'

const OLD_MATTHEW = 'e02d6201-39c3-45b8-850d-06548449c4a6'
const NEW_MATTHEW = '7ae17606-d51d-472c-b926-b5be4e331d94'

// Test data to delete from NEW
const DELETE_DIAMOND_ID    = '63ea44a1-4590-46f5-90fc-860d9f192760'
const DELETE_RING_ID       = 'e7a66a71-e5cb-4f2c-baa2-9ce211dbb1fa'
const DELETE_ENQUIRY_IDS   = [
  '642c6ed9-01fd-4e95-977c-1899b1619819',
  '7a56ea30-8413-47a7-9ce0-169a5216670a',
]

// Only import the published production ring setting
const IMPORT_RING_ID = '42ef6109-7a38-4063-a03a-caab6f6aef48'

const BUCKET = 'jewellery-media'

// ── Clients ───────────────────────────────────────────────────────────────────
const oldAdmin = createClient(OLD_URL, OLD_SRK, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const newAdmin = createClient(NEW_URL, NEW_SRK, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function rewriteUrl(str) {
  if (typeof str !== 'string') return str
  return str.replaceAll(
    'https://ieezorhsddcmjqlzxiai.supabase.co',
    'https://fiseoqdajptkyxaymkli.supabase.co'
  )
}

function rewriteJson(obj) {
  if (obj == null) return obj
  return JSON.parse(rewriteUrl(JSON.stringify(obj)))
}

function mapUser(id) {
  if (id === OLD_MATTHEW) return NEW_MATTHEW
  return id ?? null
}

// OLD uses _18k suffix; NEW ring_metal enum uses _18ct
const METAL_MAP = {
  white_gold_18k:  'white_gold_18ct',
  yellow_gold_18k: 'yellow_gold_18ct',
  rose_gold_18k:   'rose_gold_18ct',
}
function mapMetals(arr) {
  return (arr ?? []).map(m => METAL_MAP[m] ?? m)
}

function assert(condition, msg) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${msg}`)
}

async function abort(stage, msg) {
  console.error(`\n✗ ABORT at ${stage}: ${msg}`)
  process.exit(1)
}

// ── Load pre-extracted OLD data ───────────────────────────────────────────────
const old = JSON.parse(readFileSync('scripts/old-project-data.json', 'utf8'))
console.log(`Loaded OLD data: ${old.ringSettings.length} ring_settings, ${old.ringSettingMedia.length} ring_setting_media, ${old.diamonds.length} diamonds, ${old.jewelleryProducts.length} jewellery_products, ${old.jewelleryProductMedia.length} jewellery_product_media`)

// Recursively list all objects in a bucket
async function listAllObjects(client, bucket, prefix = '') {
  const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) return []
  const objects = []
  for (const item of (data ?? [])) {
    if (item.id) {
      objects.push(prefix ? `${prefix}/${item.name}` : item.name)
    } else {
      const sub = await listAllObjects(client, bucket, prefix ? `${prefix}/${item.name}` : item.name)
      objects.push(...sub)
    }
  }
  return objects
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — Create jewellery-media bucket in NEW
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 1: Create bucket ═══')
{
  const { data: buckets } = await newAdmin.storage.listBuckets()
  const exists = (buckets ?? []).some(b => b.name === BUCKET)
  if (exists) {
    console.log(`  ✓ Bucket '${BUCKET}' already exists in NEW`)
  } else {
    const { error } = await newAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: null,
      allowedMimeTypes: null,
    })
    if (error) abort('Stage 1', `Create bucket failed: ${error.message}`)
    console.log(`  ✓ Bucket '${BUCKET}' created in NEW`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — Copy all storage objects OLD → NEW
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 2: Copy storage objects ═══')
{
  const oldPaths = await listAllObjects(oldAdmin, BUCKET)
  console.log(`  Found ${oldPaths.length} objects in OLD ${BUCKET}`)
  assert(oldPaths.length === 35, `Expected 35 objects in OLD storage, got ${oldPaths.length}`)

  const newPathsBefore = await listAllObjects(newAdmin, BUCKET)
  const alreadyCopied = new Set(newPathsBefore)
  console.log(`  Already in NEW: ${alreadyCopied.size} objects`)

  let copied = 0
  let skipped = 0

  for (const path of oldPaths) {
    if (alreadyCopied.has(path)) {
      skipped++
      continue
    }
    process.stdout.write(`  Copying: ${path} ... `)

    const { data: blob, error: dlErr } = await oldAdmin.storage.from(BUCKET).download(path)
    if (dlErr) await abort('Stage 2', `Download failed for '${path}': ${dlErr.message}`)

    const { error: ulErr } = await newAdmin.storage.from(BUCKET).upload(path, blob, {
      upsert: true,
      contentType: blob.type || undefined,
    })
    if (ulErr) await abort('Stage 2', `Upload failed for '${path}': ${ulErr.message}`)

    console.log(`✓ (${Math.round(blob.size / 1024)} KB)`)
    copied++
  }

  console.log(`\n  Storage copy: ${copied} copied, ${skipped} already present`)

  // Verify final count
  const newPathsAfter = await listAllObjects(newAdmin, BUCKET)
  assert(newPathsAfter.length === 35, `Expected 35 objects in NEW after copy, got ${newPathsAfter.length}`)
  console.log(`  ✓ NEW ${BUCKET} now has ${newPathsAfter.length} objects`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3 — Delete test data from NEW
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 3: Delete test data from NEW ═══')
{
  // Delete test enquiries first (FK to diamonds/ring_settings)
  for (const id of DELETE_ENQUIRY_IDS) {
    const { error } = await newAdmin.from('enquiries').delete().eq('id', id)
    if (error) await abort('Stage 3', `Delete enquiry ${id}: ${error.message}`)
    console.log(`  ✓ Deleted enquiry ${id}`)
  }

  // Delete test diamond (may be FK-referenced by enquiries — already deleted above)
  const { error: dErr } = await newAdmin.from('diamonds').delete().eq('id', DELETE_DIAMOND_ID)
  if (dErr) await abort('Stage 3', `Delete test diamond: ${dErr.message}`)
  console.log(`  ✓ Deleted test diamond ${DELETE_DIAMOND_ID}`)

  // Delete test ring setting
  const { error: rsErr } = await newAdmin.from('ring_settings').delete().eq('id', DELETE_RING_ID)
  if (rsErr) await abort('Stage 3', `Delete test ring setting: ${rsErr.message}`)
  console.log(`  ✓ Deleted test ring setting ${DELETE_RING_ID}`)

  // Verify clean
  const { count: dCount } = await newAdmin.from('diamonds').select('id', { count: 'exact', head: true })
  const { count: rsCount } = await newAdmin.from('ring_settings').select('id', { count: 'exact', head: true })
  const { count: eCount } = await newAdmin.from('enquiries').select('id', { count: 'exact', head: true })
  console.log(`  NEW state after cleanup: diamonds=${dCount}, ring_settings=${rsCount}, enquiries=${eCount}`)
  assert(dCount === 0, `Expected 0 diamonds after cleanup, got ${dCount}`)
  assert(rsCount === 0, `Expected 0 ring_settings after cleanup, got ${rsCount}`)
  assert(eCount === 0, `Expected 0 enquiries after cleanup, got ${eCount}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4 — Import ring setting 42ef6109
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 4: Import ring setting ═══')
{
  const src = old.ringSettings.find(r => r.id === IMPORT_RING_ID)
  assert(src, `Ring setting ${IMPORT_RING_ID} not found in old-project-data.json`)

  const row = {
    id:          src.id,
    name:        src.name,
    slug:        src.slug,
    collection:  src.collection ?? null,
    description: src.description ?? null,
    short_description: null,
    metals:      mapMetals(src.metals),
    base_price_gbp: src.base_price_gbp,
    is_published: src.is_published,
    sort_order:  src.sort_order ?? 0,
    created_by:  mapUser(src.created_by),
    updated_by:  mapUser(src.updated_by),
    created_at:  src.created_at,
    updated_at:  src.updated_at,
    // Rewrite storage URLs in JSONB columns
    gallery_config:  rewriteJson(src.gallery_config),
    metal_variants:  rewriteJson(src.metal_variants),
    // Phase 1 columns — production defaults
    status:       'available',
    diamond_shapes: ['round'],
    min_carat:    0.5,
    max_carat:    3.0,
    ring_sizes:   ['F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W'],
    requires_diamond_selection:   true,
    requires_ring_size_selection: true,
    setting_style: null,
    band_style:    null,
    head_style:    null,
  }

  const { error } = await newAdmin.from('ring_settings').upsert(row, { onConflict: 'id' })
  if (error) await abort('Stage 4', `Insert ring_setting: ${error.message}`)

  // Verify
  const { data: check } = await newAdmin.from('ring_settings').select('id,name,slug,is_published,status,diamond_shapes,ring_sizes').eq('id', IMPORT_RING_ID).single()
  assert(check?.id === IMPORT_RING_ID, 'Ring setting not found after insert')
  assert(check.is_published === true, 'Ring setting not published')
  assert(check.status === 'available', 'Ring setting status not available')
  console.log(`  ✓ Ring setting imported: "${check.name}" | slug: ${check.slug} | status: ${check.status} | shapes: ${JSON.stringify(check.diamond_shapes)} | sizes: ${check.ring_sizes.length}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 5 — Import ring_setting_media (19 rows)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 5: Import ring_setting_media ═══')
{
  const media = old.ringSettingMedia.filter(m => m.ring_setting_id === IMPORT_RING_ID)
  console.log(`  ${media.length} ring_setting_media rows for ${IMPORT_RING_ID}`)
  assert(media.length === 19, `Expected 19 ring_setting_media rows, got ${media.length}`)

  const rows = media.map(m => ({
    id:              m.id,
    ring_setting_id: m.ring_setting_id,
    media_type:      m.media_type,
    storage_path:    rewriteUrl(m.storage_path),
    display_order:   m.display_order ?? 0,
    alt_text:        m.alt_text ?? null,
    is_primary:      m.is_primary ?? false,
    created_at:      m.created_at,
  }))

  const { error } = await newAdmin.from('ring_setting_media').upsert(rows, { onConflict: 'id' })
  if (error) await abort('Stage 5', `Insert ring_setting_media: ${error.message}`)

  const { count } = await newAdmin.from('ring_setting_media').select('id', { count: 'exact', head: true }).eq('ring_setting_id', IMPORT_RING_ID)
  assert(count === 19, `Expected 19 ring_setting_media after insert, got ${count}`)
  console.log(`  ✓ ${count} ring_setting_media rows imported`)

  // Verify no OLD URL remains
  const { data: check } = await newAdmin.from('ring_setting_media').select('storage_path').eq('ring_setting_id', IMPORT_RING_ID)
  const oldRefs = (check ?? []).filter(r => r.storage_path?.includes('ieezorhsddcmjqlzxiai'))
  assert(oldRefs.length === 0, `${oldRefs.length} ring_setting_media rows still reference OLD URL`)
  console.log(`  ✓ All storage_path values point to NEW project`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 6 — Import 6 production diamonds
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 6: Import diamonds ═══')
{
  const rows = old.diamonds.map(d => ({
    id:                d.id,
    sku:               d.sku,
    ring_setting_id:   d.ring_setting_id ?? null,
    cut:               d.cut,
    carat:             d.carat,
    colour:            d.colour,
    clarity:           d.clarity,
    cut_grade:         d.cut_grade,
    polish:            d.polish,
    symmetry:          d.symmetry,
    fluorescence:      d.fluorescence,
    gia_report_number: d.gia_report_number ?? null,
    gia_report_date:   d.gia_report_date ?? null,
    gia_report_url:    d.gia_report_url ?? null,
    measurement_length: d.measurement_length ?? null,
    measurement_width:  d.measurement_width ?? null,
    measurement_depth:  d.measurement_depth ?? null,
    depth_pct:         d.depth_pct ?? null,
    table_pct:         d.table_pct ?? null,
    price_gbp:         d.price_gbp,
    status:            d.status ?? 'available',
    is_published:      d.is_published ?? true,
    notes:             d.notes ?? null,
    created_by:        mapUser(d.created_by),
    updated_by:        mapUser(d.updated_by),
    created_at:        d.created_at,
    updated_at:        d.updated_at,
    // Phase 2/6 defaults — explicit
    diamond_category:   'white',
    colour_family:      null,
    colour_intensity:   null,
    colour_description: null,
    eclat_approved:     false,
    eclat_approved_at:  null,
    eclat_approved_by:  null,
    eclat_approval_note: null,
    held_until:         null,
    held_by_cart:       null,
  }))

  const { error } = await newAdmin.from('diamonds').upsert(rows, { onConflict: 'id' })
  if (error) await abort('Stage 6', `Insert diamonds: ${error.message}`)

  const { count } = await newAdmin.from('diamonds').select('id', { count: 'exact', head: true })
  assert(count === 6, `Expected 6 diamonds after insert, got ${count}`)
  console.log(`  ✓ ${count} diamonds imported`)

  // Print eligibility summary
  const { data: dCheck } = await newAdmin.from('diamonds').select('id,sku,cut,cut_grade,polish,symmetry,fluorescence,diamond_category,eclat_approved,is_published,status')
  for (const d of (dCheck ?? [])) {
    const eligible = d.cut === 'round'
      && d.cut_grade === 'excellent'
      && d.polish === 'excellent'
      && d.symmetry === 'excellent'
      && d.fluorescence === 'none'
    console.log(`  ${d.sku} | cut:${d.cut} cg:${d.cut_grade} p:${d.polish} s:${d.symmetry} f:${d.fluorescence} | cat:${d.diamond_category} | approved:${d.eclat_approved} | eligible:${eligible} | pub:${d.is_published} | status:${d.status}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 7 — Import jewellery_products (3 rows)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 7: Import jewellery_products ═══')
{
  const rows = old.jewelleryProducts.map(j => ({
    id:            j.id,
    slug:          j.slug,
    category:      j.category,
    name:          j.name,
    subtitle:      j.subtitle ?? null,
    description:   j.description ?? null,
    base_price_gbp: j.base_price_gbp,
    metals:        mapMetals(j.metals),
    show_diamond:  j.show_diamond ?? false,
    is_total_carat: j.is_total_carat ?? false,
    is_pair:       j.is_pair ?? false,
    is_published:  j.is_published ?? true,
    sort_order:    j.sort_order ?? 0,
    created_by:    mapUser(j.created_by),
    updated_by:    mapUser(j.updated_by),
    created_at:    j.created_at,
    updated_at:    j.updated_at,
    gallery_config:  rewriteJson(j.gallery_config),
    metal_variants:  rewriteJson(j.metal_variants),
  }))

  const { error } = await newAdmin.from('jewellery_products').upsert(rows, { onConflict: 'id' })
  if (error) await abort('Stage 7', `Insert jewellery_products: ${error.message}`)

  const { count } = await newAdmin.from('jewellery_products').select('id', { count: 'exact', head: true })
  assert(count === 3, `Expected 3 jewellery_products after insert, got ${count}`)
  console.log(`  ✓ ${count} jewellery_products imported`)

  const { data: jCheck } = await newAdmin.from('jewellery_products').select('id,slug,category,is_published')
  for (const j of (jCheck ?? [])) console.log(`  ${j.slug} | ${j.category} | published:${j.is_published}`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 8 — Import jewellery_product_media (6 rows)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 8: Import jewellery_product_media ═══')
{
  const rows = old.jewelleryProductMedia.map(m => ({
    id:                   m.id,
    jewellery_product_id: m.jewellery_product_id,
    media_type:           m.media_type,
    storage_path:         rewriteUrl(m.storage_path),
    display_order:        m.display_order ?? 0,
    alt_text:             m.alt_text ?? null,
    is_primary:           m.is_primary ?? false,
    created_at:           m.created_at,
  }))

  const { error } = await newAdmin.from('jewellery_product_media').upsert(rows, { onConflict: 'id' })
  if (error) await abort('Stage 8', `Insert jewellery_product_media: ${error.message}`)

  const { count } = await newAdmin.from('jewellery_product_media').select('id', { count: 'exact', head: true })
  assert(count === 6, `Expected 6 jewellery_product_media after insert, got ${count}`)
  console.log(`  ✓ ${count} jewellery_product_media rows imported`)

  // Verify no OLD URL
  const { data: check } = await newAdmin.from('jewellery_product_media').select('storage_path')
  const oldRefs = (check ?? []).filter(r => r.storage_path?.includes('ieezorhsddcmjqlzxiai'))
  assert(oldRefs.length === 0, `${oldRefs.length} jewellery_product_media still reference OLD URL`)
  console.log(`  ✓ All storage_path values point to NEW project`)
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 9 — Comprehensive verification
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══ STAGE 9: Comprehensive verification ═══')
{
  // Row counts
  const counts = {}
  for (const t of ['ring_settings','ring_setting_media','diamonds','jewellery_products','jewellery_product_media','enquiries']) {
    const { count } = await newAdmin.from(t).select('id', { count: 'exact', head: true })
    counts[t] = count
  }
  console.log('  Row counts:', JSON.stringify(counts))
  assert(counts['ring_settings'] >= 1, 'No ring_settings in NEW')
  assert(counts['ring_setting_media'] === 19, `Expected 19 ring_setting_media, got ${counts['ring_setting_media']}`)
  assert(counts['diamonds'] === 6, `Expected 6 diamonds, got ${counts['diamonds']}`)
  assert(counts['jewellery_products'] === 3, `Expected 3 jewellery_products, got ${counts['jewellery_products']}`)
  assert(counts['jewellery_product_media'] === 6, `Expected 6 jewellery_product_media, got ${counts['jewellery_product_media']}`)

  // Slugs present
  const { data: rs } = await newAdmin.from('ring_settings').select('id,slug,is_published')
  assert(rs?.some(r => r.slug === 'lumiere-halo'), 'lumiere-halo ring setting missing')
  assert(rs?.find(r => r.slug === 'lumiere-halo')?.is_published === true, 'lumiere-halo not published')
  assert(!rs?.some(r => r.slug === 'the-eclat-solitaire'), 'test ring setting still present')

  const { data: jps } = await newAdmin.from('jewellery_products').select('slug')
  assert(jps?.some(j => j.slug === 'soleil-solitaire'), 'soleil-solitaire missing')
  assert(jps?.some(j => j.slug === 'riviere-tennis'), 'riviere-tennis missing')
  assert(jps?.some(j => j.slug === 'aura-halo-studs'), 'aura-halo-studs missing')

  // SKUs
  const { data: dms } = await newAdmin.from('diamonds').select('sku,status,is_published')
  const skus = dms?.map(d => d.sku).sort()
  assert(skus?.includes('EGD-2026-000001'), 'EGD-2026-000001 missing')
  assert(skus?.includes('EGD-2026-000006'), 'EGD-2026-000006 missing')
  assert(dms?.every(d => d.is_published === true), 'Some diamonds not published')
  assert(dms?.every(d => d.status === 'available'), 'Some diamonds not available')

  // No OLD URLs in DB
  const { data: rsData } = await newAdmin.from('ring_settings').select('metal_variants,gallery_config').eq('id', IMPORT_RING_ID).single()
  const rsJson = JSON.stringify(rsData)
  assert(!rsJson.includes('ieezorhsddcmjqlzxiai'), 'OLD URL found in ring_settings JSONB')
  console.log(`  ✓ ring_settings JSONB: no OLD URL references`)

  // Verify storage paths are accessible in NEW
  console.log('  Spot-checking 3 storage URLs in NEW...')
  const { data: rsmCheck } = await newAdmin.from('ring_setting_media').select('storage_path').eq('ring_setting_id', IMPORT_RING_ID).limit(3)
  for (const m of (rsmCheck ?? [])) {
    const url = m.storage_path
    assert(url.includes('fiseoqdajptkyxaymkli'), `Storage path still references OLD: ${url}`)
    const res = await fetch(url, { method: 'HEAD' })
    assert(res.ok, `URL not accessible (${res.status}): ${url}`)
    console.log(`    ✓ ${url.split('/').pop()} → HTTP ${res.status}`)
  }

  // Verify OLD project untouched — read a count and confirm it didn't change
  const { count: oldRsCount } = await oldAdmin.from('ring_settings').select('id', { count: 'exact', head: true })
  const { count: oldDCount }  = await oldAdmin.from('diamonds').select('id', { count: 'exact', head: true })
  assert(oldRsCount === 2, `OLD ring_settings count changed! Expected 2, got ${oldRsCount}`)
  assert(oldDCount === 6, `OLD diamonds count changed! Expected 6, got ${oldDCount}`)
  console.log(`  ✓ OLD project unchanged: ring_settings=${oldRsCount}, diamonds=${oldDCount}`)

  console.log('\n  ═══ VERIFICATION PASSED ═══')
}

console.log('\n✓ Migration complete. Proceed to Vercel cutover.')
