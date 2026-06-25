/**
 * Seeds the minimum test data required for Phase 6 integration tests.
 * Run once: node scripts/seed-test-data.mjs
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const raw = readFileSync('.env.local', 'utf8')
const env = {}
for (const line of raw.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i < 0) continue
  const k = t.slice(0, i).trim()
  let v = t.slice(i + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  env[k] = v
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log('=== Checking current state ===')

// Check diamond
const { data: diamond } = await admin.from('diamonds').select('*').eq('id', '63ea44a1-4590-46f5-90fc-860d9f192760').single()
console.log('Existing diamond:', JSON.stringify({
  id: diamond?.id,
  cut: diamond?.cut,
  polish: diamond?.polish,
  symmetry: diamond?.symmetry,
  fluorescence: diamond?.fluorescence,
  cut_grade: diamond?.cut_grade,
  diamond_category: diamond?.diamond_category,
  is_published: diamond?.is_published,
  status: diamond?.status,
  price_gbp: diamond?.price_gbp,
}, null, 2))

// Check ring setting
const { data: setting } = await admin.from('ring_settings').select('*').eq('id', 'e7a66a71-e5cb-4f2c-baa2-9ce211dbb1fa').single()
console.log('Existing ring setting:', JSON.stringify({
  id: setting?.id,
  name: setting?.name,
  status: setting?.status,
  is_published: setting?.is_published,
  diamond_shapes: setting?.diamond_shapes,
  ring_sizes: setting?.ring_sizes,
  metal_variants: setting?.metal_variants ? '(present)' : null,
  base_price_gbp: setting?.base_price_gbp,
}, null, 2))

console.log('\n=== Seeding eligible diamond ===')

// Make the diamond eligible by fixing symmetry to 'excellent'
const { data: updatedDiamond, error: dErr } = await admin
  .from('diamonds')
  .update({ symmetry: 'excellent' })
  .eq('id', '63ea44a1-4590-46f5-90fc-860d9f192760')
  .select('id, polish, symmetry, fluorescence, cut_grade, status')
  .single()

console.log('Updated diamond:', JSON.stringify({ data: updatedDiamond, error: dErr }))

console.log('\n=== Ensuring ring setting is published with round shape ===')

// Ensure ring setting has round in diamond_shapes, is published, and has at least one metal variant
const currentShapes = (setting?.diamond_shapes) ?? []
const shapes = currentShapes.includes('round') ? currentShapes : [...currentShapes, 'round']

// Check if metal_variants is set
let metalVariants = setting?.metal_variants
if (!metalVariants || (Array.isArray(metalVariants) && metalVariants.length === 0)) {
  metalVariants = [
    {
      id: 'mv-platinum-1',
      metal: 'platinum',
      sku: 'ES-PT-01',
      enabled: true,
      price: 3500,
      gallery: { slots: [] },
    },
    {
      id: 'mv-yellow-gold-1',
      metal: 'yellow-gold',
      sku: 'ES-YG-01',
      enabled: true,
      price: 3200,
      gallery: { slots: [] },
    },
  ]
}

const ringSizes = (setting?.ring_sizes ?? []).length ? setting.ring_sizes : ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q']

const { data: updatedSetting, error: sErr } = await admin
  .from('ring_settings')
  .update({
    is_published: true,
    diamond_shapes: shapes,
    ring_sizes: ringSizes,
    metal_variants: metalVariants,
    requires_diamond_selection: true,
    requires_ring_size_selection: true,
  })
  .eq('id', 'e7a66a71-e5cb-4f2c-baa2-9ce211dbb1fa')
  .select('id, name, is_published, diamond_shapes, ring_sizes')
  .single()

console.log('Updated setting:', JSON.stringify({ data: updatedSetting, error: sErr }))

console.log('\n=== Final verification ===')
const { data: finalDiamond } = await admin
  .from('diamonds')
  .select('id, polish, symmetry, fluorescence, cut_grade, diamond_category, status, is_published')
  .eq('id', '63ea44a1-4590-46f5-90fc-860d9f192760')
  .single()
console.log('Final diamond state:', finalDiamond)

console.log('\nDone. Run: npx vitest run --config vitest.integration.config.ts')
