/**
 * seed-examples.mjs
 * Inserts 1 example product per category (ring, necklace, bracelet, earring)
 * with a hero video URL + static product image uploaded to Supabase Storage.
 *
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/seed-examples.mjs
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// ── Free Pexels MP4 videos (short, loopable jewellery/luxury lifestyle) ────────
// These are direct CDN links — no auth required
const HERO_VIDEOS = {
  ring:     'https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4',
  necklace: 'https://videos.pexels.com/video-files/3044127/3044127-uhd_2560_1440_25fps.mp4',
  bracelet: 'https://videos.pexels.com/video-files/7578540/7578540-hd_1920_1080_30fps.mp4',
  earring:  'https://videos.pexels.com/video-files/4763824/4763824-uhd_2560_1440_25fps.mp4',
}

// ── Upload image to Supabase Storage ─────────────────────────────────────────

async function uploadImage(localPath, storagePath, bucket = 'jewellery-media') {
  const fileBuffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true,
    })
  if (error) {
    console.error(`[seed] Upload failed for ${storagePath}:`, error.message)
    return null
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  console.log(`[seed] Uploaded ${storagePath} → ${data.publicUrl}`)
  return data.publicUrl
}

// ── Get a system staff user id ────────────────────────────────────────────────

async function getStaffUserId() {
  const { data } = await supabase.from('staff_roles').select('user_id').limit(1).single()
  return data?.user_id ?? '00000000-0000-0000-0000-000000000000'
}

// ── Delete any existing seed products so re-runs are idempotent ───────────────

async function clearExisting() {
  const slugs = ['lumiere-halo', 'soleil-solitaire', 'riviere-tennis', 'aura-halo-studs']
  await supabase.from('ring_settings').delete().in('slug', slugs)
  await supabase.from('jewellery_products').delete().in('slug', slugs)
  console.log('[seed] Cleared existing seed rows')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const actorId = await getStaffUserId()
  console.log('[seed] Actor user id:', actorId)

  await clearExisting()

  // ── 1. ENGAGEMENT RING ────────────────────────────────────────────────────

  const ringImageUrl = await uploadImage(
    path.join(__dirname, '../public/seed/ring-lumiere.png'),
    'seed/ring-lumiere.png',
    'jewellery-media',
  )

  const { data: ring, error: ringErr } = await supabase
    .from('ring_settings')
    .insert({
      name:           'Lumière Halo',
      slug:           'lumiere-halo',
      collection:     'Lumière',
      description:    'A round brilliant diamond surrounded by a shimmering pavé halo, set in polished platinum. Handcrafted in our London atelier.',
      metals:         ['platinum', 'white_gold_18k', 'yellow_gold_18k'],
      base_price_gbp: 6800,
      is_published:   true,
      created_by:     actorId,
      updated_by:     actorId,
    })
    .select()
    .single()

  if (ringErr) { console.error('[seed] Ring insert error:', ringErr.message); process.exit(1) }
  console.log('[seed] Ring created:', ring.id)

  // Insert video media (hero) + image media (product still)
  await supabase.from('ring_setting_media').insert([
    {
      ring_setting_id: ring.id,
      media_type:      'video',
      storage_path:    HERO_VIDEOS.ring,
      display_order:   0,
      is_primary:      false,
      alt_text:        'Lumière Halo hero video',
    },
    ...(ringImageUrl ? [{
      ring_setting_id: ring.id,
      media_type:      'image',
      storage_path:    ringImageUrl,
      display_order:   1,
      is_primary:      true,
      alt_text:        'Lumière Halo ring',
    }] : []),
  ])
  console.log('[seed] Ring media inserted')

  // ── 2. NECKLACE ───────────────────────────────────────────────────────────

  const necklaceImageUrl = await uploadImage(
    path.join(__dirname, '../public/seed/necklace-soleil.png'),
    'seed/necklace-soleil.png',
    'jewellery-media',
  )

  const { data: necklace, error: necklaceErr } = await supabase
    .from('jewellery_products')
    .insert({
      category:       'necklaces',
      name:           'Soleil Solitaire Pendant',
      slug:           'soleil-solitaire',
      subtitle:       'Soleil Collection',
      description:    'A single round brilliant diamond suspended on a fine platinum chain. The purest expression of diamond beauty.',
      metals:         ['platinum', 'white_gold_18k'],
      base_price_gbp: 4200,
      is_published:   true,
      created_by:     actorId,
      updated_by:     actorId,
    })
    .select()
    .single()

  if (necklaceErr) { console.error('[seed] Necklace insert error:', necklaceErr.message); process.exit(1) }
  console.log('[seed] Necklace created:', necklace.id)

  await supabase.from('jewellery_product_media').insert([
    {
      jewellery_product_id: necklace.id,
      media_type:           'video',
      storage_path:         HERO_VIDEOS.necklace,
      display_order:        0,
      is_primary:           false,
      alt_text:             'Soleil Solitaire hero video',
    },
    ...(necklaceImageUrl ? [{
      jewellery_product_id: necklace.id,
      media_type:           'image',
      storage_path:         necklaceImageUrl,
      display_order:        1,
      is_primary:           true,
      alt_text:             'Soleil Solitaire pendant',
    }] : []),
  ])
  console.log('[seed] Necklace media inserted')

  // ── 3. BRACELET ───────────────────────────────────────────────────────────

  const braceletImageUrl = await uploadImage(
    path.join(__dirname, '../public/seed/bracelet-riviere.png'),
    'seed/bracelet-riviere.png',
    'jewellery-media',
  )

  const { data: bracelet, error: braceletErr } = await supabase
    .from('jewellery_products')
    .insert({
      category:       'bracelets',
      name:           'Rivière Tennis Bracelet',
      slug:           'riviere-tennis',
      subtitle:       'Rivière Collection',
      description:    'Hand-articulated platinum tennis bracelet set with matched round brilliant diamonds from end to end.',
      metals:         ['platinum', 'white_gold_18k', 'yellow_gold_18k'],
      base_price_gbp: 9500,
      is_published:   true,
      created_by:     actorId,
      updated_by:     actorId,
    })
    .select()
    .single()

  if (braceletErr) { console.error('[seed] Bracelet insert error:', braceletErr.message); process.exit(1) }
  console.log('[seed] Bracelet created:', bracelet.id)

  await supabase.from('jewellery_product_media').insert([
    {
      jewellery_product_id: bracelet.id,
      media_type:           'video',
      storage_path:         HERO_VIDEOS.bracelet,
      display_order:        0,
      is_primary:           false,
      alt_text:             'Rivière Tennis Bracelet hero video',
    },
    ...(braceletImageUrl ? [{
      jewellery_product_id: bracelet.id,
      media_type:           'image',
      storage_path:         braceletImageUrl,
      display_order:        1,
      is_primary:           true,
      alt_text:             'Rivière Tennis Bracelet',
    }] : []),
  ])
  console.log('[seed] Bracelet media inserted')

  // ── 4. EARRINGS ───────────────────────────────────────────────────────────

  const earringsImageUrl = await uploadImage(
    path.join(__dirname, '../public/seed/earrings-aura.png'),
    'seed/earrings-aura.png',
    'jewellery-media',
  )

  const { data: earring, error: earringErr } = await supabase
    .from('jewellery_products')
    .insert({
      category:       'earrings',
      name:           'Aura Halo Studs',
      slug:           'aura-halo-studs',
      subtitle:       'Aura Collection',
      description:    'Perfectly matched round brilliant diamonds, each crowned with a micro-pavé halo. Crafted in platinum for a timeless look.',
      metals:         ['platinum', 'white_gold_18k'],
      base_price_gbp: 3600,
      is_published:   true,
      is_pair:        true,
      created_by:     actorId,
      updated_by:     actorId,
    })
    .select()
    .single()

  if (earringErr) { console.error('[seed] Earring insert error:', earringErr.message); process.exit(1) }
  console.log('[seed] Earring created:', earring.id)

  await supabase.from('jewellery_product_media').insert([
    {
      jewellery_product_id: earring.id,
      media_type:           'video',
      storage_path:         HERO_VIDEOS.earring,
      display_order:        0,
      is_primary:           false,
      alt_text:             'Aura Halo Studs hero video',
    },
    ...(earringsImageUrl ? [{
      jewellery_product_id: earring.id,
      media_type:           'image',
      storage_path:         earringsImageUrl,
      display_order:        1,
      is_primary:           true,
      alt_text:             'Aura Halo Studs',
    }] : []),
  ])
  console.log('[seed] Earring media inserted')

  console.log('\n[seed] Done. Visit /engagement-rings, /necklaces, /bracelets, /earrings to preview.')
}

main().catch(err => { console.error('[seed] Fatal:', err); process.exit(1) })
