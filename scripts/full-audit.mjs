/**
 * Full read-only audit of both Supabase projects.
 * No mutations. Outputs structured JSON for comparison report.
 */
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const OLD_URL  = 'https://ieezorhsddcmjqlzxiai.supabase.co'
const OLD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZXpvcmhzZGRjbWpxbHp4aWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODg4OTgsImV4cCI6MjA5NzY2NDg5OH0.VU72lFRX-h81tgypR7N9CXmR_E8FDfmuXfMP2Cvmz-s'
const OLD_SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZXpvcmhzZGRjbWpxbHp4aWFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA4ODg5OCwiZXhwIjoyMDk3NjY0ODk4fQ.j_0s3oGrzQ_B_hU9t58F0cBUVRS26d-v_L8MvJOMF7M'

const NEW_URL  = 'https://fiseoqdajptkyxaymkli.supabase.co'
const NEW_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc2VvcWRhanB0a3l4YXlta2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNTU3NDQsImV4cCI6MjA5NzYzMTc0NH0.cMV3rQ1qpESp8uyiSqkhVHi7niekbkOMvCQy9uaCF1s'
const NEW_SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc2VvcWRhanB0a3l4YXlta2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA1NTc0NCwiZXhwIjoyMDk3NjMxNzQ0fQ.QBCRueq7TuxIB2w7JYF7n6I-TjB9Tkm2xagsvOLkIUo'

function admin(url, srk) {
  return createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } })
}
function anon(url, key) {
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getAll(client, table, select = '*') {
  const { data, error, count } = await client.from(table).select(select, { count: 'exact' }).order('created_at', { ascending: true }).limit(1000)
  if (error) return { error: error.message, count: null, data: [] }
  return { error: null, count, data: data ?? [] }
}

async function tableExists(client, table) {
  const { error } = await client.from(table).select('id').limit(0)
  return !error || !error.message.includes('does not exist')
}

// Recursively list all objects in a bucket folder
async function listAllObjects(client, bucket, prefix = '') {
  const { data, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) return { error: error.message, objects: [] }
  const objects = []
  for (const item of (data ?? [])) {
    if (item.id) {
      // It's a file
      objects.push({
        path: prefix ? `${prefix}/${item.name}` : item.name,
        size: item.metadata?.size ?? null,
        type: item.metadata?.mimetype ?? null,
        updated_at: item.updated_at,
      })
    } else {
      // It's a folder — recurse
      const sub = await listAllObjects(client, bucket, prefix ? `${prefix}/${item.name}` : item.name)
      objects.push(...sub.objects)
    }
  }
  return { error: null, objects }
}

const oldAdmin = admin(OLD_URL, OLD_SRK)
const newAdmin = admin(NEW_URL, NEW_SRK)

// ── Collect all table data ────────────────────────────────────────────────────

const CORE_TABLES = [
  'ring_settings',
  'ring_setting_media',
  'diamonds',
  'diamond_media',
  'ring_setting_diamonds',
  'jewellery_products',
  'jewellery_product_media',
  'jewellery_diamonds',
  'hero_media',
  'enquiries',
  'orders',
  'profiles',
  'staff_roles',
  'suppliers',
]

const result = {
  auditedAt: new Date().toISOString(),
  old: { url: OLD_URL, tables: {}, buckets: {} },
  new: { url: NEW_URL, tables: {}, buckets: {} },
}

process.stdout.write('Auditing tables')
for (const table of CORE_TABLES) {
  process.stdout.write(` ${table}`)
  const [o, n] = await Promise.all([getAll(oldAdmin, table), getAll(newAdmin, table)])
  result.old.tables[table] = o
  result.new.tables[table] = n
}
console.log('\nTables done.')

// ── Get auth.users counts via admin (list users) ─────────────────────────────
async function getUserList(url, srk) {
  try {
    const c = createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data, error } = await c.auth.admin.listUsers({ perPage: 100 })
    if (error) return { error: error.message, count: null, users: [] }
    return {
      error: null,
      count: data.users.length,
      users: data.users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        app_metadata: u.app_metadata,
        user_metadata: u.user_metadata,
      })),
    }
  } catch (e) {
    return { error: e.message, count: null, users: [] }
  }
}

process.stdout.write('Fetching auth.users OLD...')
result.old.auth = await getUserList(OLD_URL, OLD_SRK)
process.stdout.write(' NEW...')
result.new.auth = await getUserList(NEW_URL, NEW_SRK)
console.log(' done.')

// ── Get migration history ─────────────────────────────────────────────────────
// Accessible via service role through a raw query endpoint if available
// We'll use the CLI migration list output which was already captured.
// As a proxy, check which columns exist to infer applied migrations.
async function checkColumns(client, table, cols) {
  const results = {}
  for (const col of cols) {
    const { error } = await client.from(table).select(col).limit(0)
    results[col] = !error
  }
  return results
}

process.stdout.write('Checking schema columns...')
result.old.schemaProbe = {
  diamonds: await checkColumns(oldAdmin, 'diamonds', [
    'id','cut','carat','colour','clarity','polish','symmetry','fluorescence','cut_grade','price_gbp','status','is_published',
    'diamond_category','colour_family','colour_intensity','colour_description',
    'eclat_approved','eclat_approved_at','eclat_approved_by','eclat_approval_note',
    'held_until','held_by_cart',
  ]),
  ring_settings: await checkColumns(oldAdmin, 'ring_settings', [
    'id','name','slug','is_published','base_price_gbp','metal_variants','gallery_config',
    'status','diamond_shapes','min_carat','max_carat','ring_sizes',
    'requires_diamond_selection','requires_ring_size_selection',
    'setting_style','band_style','head_style',
  ]),
  enquiries: await checkColumns(oldAdmin, 'enquiries', [
    'id','customer_name','customer_email','customer_phone','subject','message',
    'ring_setting_id','diamond_id','metal','configuration',
  ]),
}
result.new.schemaProbe = {
  diamonds: await checkColumns(newAdmin, 'diamonds', [
    'id','cut','carat','colour','clarity','polish','symmetry','fluorescence','cut_grade','price_gbp','status','is_published',
    'diamond_category','colour_family','colour_intensity','colour_description',
    'eclat_approved','eclat_approved_at','eclat_approved_by','eclat_approval_note',
    'held_until','held_by_cart',
  ]),
  ring_settings: await checkColumns(newAdmin, 'ring_settings', [
    'id','name','slug','is_published','base_price_gbp','metal_variants','gallery_config',
    'status','diamond_shapes','min_carat','max_carat','ring_sizes',
    'requires_diamond_selection','requires_ring_size_selection',
    'setting_style','band_style','head_style',
  ]),
  enquiries: await checkColumns(newAdmin, 'enquiries', [
    'id','customer_name','customer_email','customer_phone','subject','message',
    'ring_setting_id','diamond_id','metal','configuration',
  ]),
}
console.log(' done.')

// ── Storage audit ─────────────────────────────────────────────────────────────
async function auditBuckets(client, label) {
  const { data: buckets, error } = await client.storage.listBuckets()
  if (error) return { error: error.message }
  const out = {}
  for (const b of buckets) {
    process.stdout.write(` [${label}:${b.name}]`)
    const listed = await listAllObjects(client, b.name)
    out[b.name] = {
      id: b.id,
      public: b.public,
      fileSizeLimit: b.file_size_limit,
      allowedMimeTypes: b.allowed_mime_types,
      objects: listed.objects,
      objectCount: listed.objects.length,
      totalBytes: listed.objects.reduce((s, o) => s + (o.size ?? 0), 0),
    }
  }
  return out
}

process.stdout.write('Auditing storage')
result.old.buckets = await auditBuckets(oldAdmin, 'OLD')
result.new.buckets = await auditBuckets(newAdmin, 'NEW')
console.log('\nStorage done.')

// ── Cross-reference: check which OLD storage paths exist in NEW storage ───────
// Collect all OLD storage paths
const oldStoragePaths = new Set()
for (const [, bucket] of Object.entries(result.old.buckets)) {
  for (const obj of (bucket.objects ?? [])) oldStoragePaths.add(obj.path)
}
const newStoragePaths = new Set()
for (const [, bucket] of Object.entries(result.new.buckets)) {
  for (const obj of (bucket.objects ?? [])) newStoragePaths.add(obj.path)
}

// Collect all paths referenced by OLD DB records
function extractUrls(obj) {
  const urls = []
  const str = JSON.stringify(obj)
  const matches = str.match(/https:\/\/ieezorhsddcmjqlzxiai\.supabase\.co\/storage\/v1\/object\/public\/([^\s"]+)/g) ?? []
  for (const m of matches) {
    const path = m.replace(/https:\/\/ieezorhsddcmjqlzxiai\.supabase\.co\/storage\/v1\/object\/public\//, '')
    const [bucket, ...rest] = path.split('/')
    urls.push({ bucket, path: rest.join('/'), full: m })
  }
  return urls
}

const referencedMedia = []
for (const table of ['ring_settings', 'ring_setting_media', 'jewellery_products', 'jewellery_product_media']) {
  for (const row of (result.old.tables[table]?.data ?? [])) {
    for (const ref of extractUrls(row)) {
      referencedMedia.push({ ...ref, table, rowId: row.id })
    }
  }
}

// Deduplicate by path
const uniqueRefs = [...new Map(referencedMedia.map(r => [`${r.bucket}/${r.path}`, r])).values()]

result.crossRef = {
  oldStoragePaths: [...oldStoragePaths].sort(),
  newStoragePaths: [...newStoragePaths].sort(),
  referencedByOldDB: uniqueRefs.map(r => ({
    ...r,
    existsInOldStorage: oldStoragePaths.has(r.path),
    existsInNewStorage: newStoragePaths.has(r.path),
  })),
}

// Write full JSON
writeFileSync('scripts/full-audit-result.json', JSON.stringify(result, null, 2))
console.log('\nFull audit written to scripts/full-audit-result.json')
console.log('Total size:', Math.round(JSON.stringify(result).length / 1024), 'KB')
