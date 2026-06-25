/**
 * Audits both Supabase projects side-by-side for production cutover decision.
 * Read-only — no mutations.
 */
import { createClient } from '@supabase/supabase-js'

// OLD / currently deployed
const OLD_URL  = 'https://ieezorhsddcmjqlzxiai.supabase.co'
const OLD_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZXpvcmhzZGRjbWpxbHp4aWFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODg4OTgsImV4cCI6MjA5NzY2NDg5OH0.VU72lFRX-h81tgypR7N9CXmR_E8FDfmuXfMP2Cvmz-s'
const OLD_SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZXpvcmhzZGRjbWpxbHp4aWFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA4ODg5OCwiZXhwIjoyMDk3NjY0ODk4fQ.j_0s3oGrzQ_B_hU9t58F0cBUVRS26d-v_L8MvJOMF7M'

// TARGET / migrated
const NEW_URL  = 'https://fiseoqdajptkyxaymkli.supabase.co'
const NEW_SRK  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpc2VvcWRhanB0a3l4YXlta2xpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA1NTc0NCwiZXhwIjoyMDk3NjMxNzQ0fQ.QBCRueq7TuxIB2w7JYF7n6I-TjB9Tkm2xagsvOLkIUo'

function admin(url, srk) {
  return createClient(url, srk, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function countTable(client, table) {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true })
  if (error) return `ERR: ${error.message}`
  return count ?? 0
}

async function sampleTable(client, table, cols, limit = 5) {
  const { data, error } = await client.from(table).select(cols).limit(limit)
  if (error) return { error: error.message }
  return data
}

async function listBuckets(client) {
  const { data, error } = await client.storage.listBuckets()
  if (error) return { error: error.message }
  return data
}

async function countBucketObjects(client, bucket) {
  const { data, error } = await client.storage.from(bucket).list('', { limit: 1000 })
  if (error) return `ERR: ${error.message}`
  // Recursive count would be needed for nested folders, but a flat list gives a first approximation
  return data?.length ?? 0
}

async function getMigrationList(_client) {
  // schema_migrations is not accessible via PostgREST; skipped.
  return []
}

const TABLES = [
  'ring_settings',
  'ring_setting_media',
  'diamonds',
  'diamond_media',
  'jewellery_products',
  'jewellery_product_media',
  'enquiries',
  'hero_media',
  'ring_setting_diamonds',
  'jewellery_diamonds',
]

const oldAdmin = admin(OLD_URL, OLD_SRK)
const newAdmin = admin(NEW_URL, NEW_SRK)

console.log('=' .repeat(70))
console.log('SUPABASE PROJECT AUDIT — READ ONLY')
console.log('=' .repeat(70))
console.log('OLD (deployed):', OLD_URL)
console.log('NEW (target):  ', NEW_URL)
console.log()

// ── Table counts ─────────────────────────────────────────────────────────────

console.log('── TABLE COUNTS ────────────────────────────────────────────────────')
console.log(`${'Table'.padEnd(30)} ${'OLD'.padStart(8)} ${'NEW'.padStart(8)}`)
console.log('-'.repeat(50))

for (const t of TABLES) {
  const [oldCount, newCount] = await Promise.all([
    countTable(oldAdmin, t),
    countTable(newAdmin, t),
  ])
  console.log(`${t.padEnd(30)} ${String(oldCount).padStart(8)} ${String(newCount).padStart(8)}`)
}

// ── Published ring settings ──────────────────────────────────────────────────

console.log()
console.log('── PUBLISHED RING SETTINGS (OLD) ────────────────────────────────────')
const oldRings = await sampleTable(oldAdmin, 'ring_settings', 'id, name, slug, status, is_published, created_at', 20)
console.log(JSON.stringify(oldRings, null, 2))

console.log()
console.log('── PUBLISHED RING SETTINGS (NEW) ────────────────────────────────────')
const newRings = await sampleTable(newAdmin, 'ring_settings', 'id, name, slug, status, is_published, created_at', 20)
console.log(JSON.stringify(newRings, null, 2))

// ── Diamond samples ───────────────────────────────────────────────────────────

console.log()
console.log('── DIAMONDS (OLD) ────────────────────────────────────────────────────')
const oldDiamonds = await sampleTable(oldAdmin, 'diamonds', 'id, sku, cut, carat, colour, clarity, status, is_published, created_at', 10)
console.log(JSON.stringify(oldDiamonds, null, 2))

console.log()
console.log('── DIAMONDS (NEW) ────────────────────────────────────────────────────')
const newDiamonds = await sampleTable(newAdmin, 'diamonds', 'id, sku, cut, carat, colour, clarity, status, is_published, created_at', 10)
console.log(JSON.stringify(newDiamonds, null, 2))

// ── Enquiries ────────────────────────────────────────────────────────────────

console.log()
console.log('── ENQUIRIES (OLD) ───────────────────────────────────────────────────')
const oldEnqs = await sampleTable(oldAdmin, 'enquiries', 'id, customer_name, customer_email, created_at', 10)
console.log(JSON.stringify(oldEnqs, null, 2))

console.log()
console.log('── ENQUIRIES (NEW) ───────────────────────────────────────────────────')
const newEnqs = await sampleTable(newAdmin, 'enquiries', 'id, customer_name, customer_email, created_at', 10)
console.log(JSON.stringify(newEnqs, null, 2))

// ── Storage buckets ──────────────────────────────────────────────────────────

console.log()
console.log('── STORAGE BUCKETS (OLD) ─────────────────────────────────────────────')
const oldBuckets = await listBuckets(oldAdmin)
console.log(JSON.stringify(oldBuckets, null, 2))

console.log()
console.log('── STORAGE BUCKETS (NEW) ─────────────────────────────────────────────')
const newBuckets = await listBuckets(newAdmin)
console.log(JSON.stringify(newBuckets, null, 2))

// ── Schema check — does OLD have Phase 2/6 columns? ─────────────────────────

console.log()
console.log('── SCHEMA CHECK: PHASE 2/6 COLUMNS ──────────────────────────────────')
const oldColCheck = await oldAdmin.from('diamonds').select('diamond_category, eclat_approved, held_until, held_by_cart').limit(0)
const newColCheck = await newAdmin.from('diamonds').select('diamond_category, eclat_approved, held_until, held_by_cart').limit(0)
console.log('OLD has Phase 2/6 columns:', oldColCheck.error ? `NO — ${oldColCheck.error.message}` : 'YES')
console.log('NEW has Phase 2/6 columns:', newColCheck.error ? `NO — ${newColCheck.error.message}` : 'YES')

// ── Jewellery products sample ────────────────────────────────────────────────

console.log()
console.log('── JEWELLERY PRODUCTS (OLD) ──────────────────────────────────────────')
const oldJewellery = await sampleTable(oldAdmin, 'jewellery_products', 'id, name, slug, category, is_published, created_at', 10)
console.log(JSON.stringify(oldJewellery, null, 2))

console.log()
console.log('── JEWELLERY PRODUCTS (NEW) ──────────────────────────────────────────')
const newJewellery = await sampleTable(newAdmin, 'jewellery_products', 'id, name, slug, category, is_published, created_at', 10)
console.log(JSON.stringify(newJewellery, null, 2))

console.log()
console.log('=' .repeat(70))
console.log('AUDIT COMPLETE — no mutations made')
console.log('=' .repeat(70))
