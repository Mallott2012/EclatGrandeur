/**
 * update-media.mjs
 * Replaces the broken external hero video with a reliable editorial lifestyle
 * image (uploaded to Supabase Storage) for each seed product's media box.
 *
 * Run: node --env-file-if-exists=/vercel/share/.env.project scripts/update-media.mjs
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

async function uploadImage(localPath, storagePath, bucket = 'jewellery-media') {
  const fileBuffer = fs.readFileSync(localPath)
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, { contentType: 'image/png', upsert: true })
  if (error) { console.error(`[update] Upload failed for ${storagePath}:`, error.message); return null }
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath)
  console.log(`[update] Uploaded ${storagePath}`)
  return data.publicUrl
}

async function main() {
  // ── RING (ring_setting_media) ──────────────────────────────────────────────
  const ringMediaUrl = await uploadImage(
    path.join(__dirname, '../public/seed/media-ring.png'),
    'seed/media-ring.png',
  )
  const { data: ring } = await supabase
    .from('ring_settings').select('id').eq('slug', 'lumiere-halo').single()
  if (ring && ringMediaUrl) {
    // remove old video rows, set the lifestyle image as display_order 0 (the media box)
    await supabase.from('ring_setting_media').delete().eq('ring_setting_id', ring.id).eq('media_type', 'video')
    await supabase.from('ring_setting_media').insert({
      ring_setting_id: ring.id,
      media_type:      'image',
      storage_path:    ringMediaUrl,
      display_order:   0,
      is_primary:      false,
      alt_text:        'Lumière Halo editorial',
    })
    console.log('[update] Ring media box set')
  }

  // ── JEWELLERY PRODUCTS (jewellery_product_media) ───────────────────────────
  const jobs = [
    { slug: 'soleil-solitaire', file: 'media-necklace.png', store: 'seed/media-necklace.png', alt: 'Soleil Solitaire editorial' },
    { slug: 'riviere-tennis',   file: 'media-bracelet.png', store: 'seed/media-bracelet.png', alt: 'Rivière Tennis editorial' },
    { slug: 'aura-halo-studs',  file: 'media-earrings.png', store: 'seed/media-earrings.png', alt: 'Aura Halo Studs editorial' },
  ]

  for (const job of jobs) {
    const url = await uploadImage(path.join(__dirname, `../public/seed/${job.file}`), job.store)
    const { data: prod } = await supabase
      .from('jewellery_products').select('id').eq('slug', job.slug).single()
    if (prod && url) {
      await supabase.from('jewellery_product_media').delete().eq('jewellery_product_id', prod.id).eq('media_type', 'video')
      await supabase.from('jewellery_product_media').insert({
        jewellery_product_id: prod.id,
        media_type:           'image',
        storage_path:         url,
        display_order:        0,
        is_primary:           false,
        alt_text:             job.alt,
      })
      console.log(`[update] ${job.slug} media box set`)
    }
  }

  console.log('\n[update] Done.')
}

main().catch(err => { console.error('[update] Fatal:', err); process.exit(1) })
