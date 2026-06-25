/**
 * Extracts full data from the OLD project for migration planning.
 * Read-only. Outputs JSON that the migration script will consume.
 */
import { writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const OLD_URL = 'https://ieezorhsddcmjqlzxiai.supabase.co'
const OLD_SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllZXpvcmhzZGRjbWpxbHp4aWFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjA4ODg5OCwiZXhwIjoyMDk3NjY0ODk4fQ.j_0s3oGrzQ_B_hU9t58F0cBUVRS26d-v_L8MvJOMF7M'

const old = createClient(OLD_URL, OLD_SRK, { auth: { autoRefreshToken: false, persistSession: false } })

// ── Ring settings — use * to discover actual columns ─────────────────────────
const { data: ringSettings, error: rsErr } = await old.from('ring_settings').select('*').order('created_at')
console.log('ring_settings error:', rsErr?.message ?? 'none')
console.log('ring_settings count:', ringSettings?.length)
console.log('ring_settings columns:', ringSettings?.[0] ? Object.keys(ringSettings[0]).join(', ') : 'N/A')

// ── Ring setting media ────────────────────────────────────────────────────────
const { data: rsmedia, error: rsmErr } = await old.from('ring_setting_media').select('*').order('ring_setting_id')
console.log('\nring_setting_media error:', rsmErr?.message ?? 'none')
console.log('ring_setting_media count:', rsmedia?.length)
console.log('ring_setting_media columns:', rsmedia?.[0] ? Object.keys(rsmedia[0]).join(', ') : 'N/A')

// ── Diamonds ─────────────────────────────────────────────────────────────────
const { data: diamonds, error: dErr } = await old.from('diamonds').select('*').order('created_at')
console.log('\ndiamonds error:', dErr?.message ?? 'none')
console.log('diamonds count:', diamonds?.length)
console.log('diamonds columns:', diamonds?.[0] ? Object.keys(diamonds[0]).join(', ') : 'N/A')

// ── Jewellery products ────────────────────────────────────────────────────────
const { data: jewellery, error: jErr } = await old.from('jewellery_products').select('*').order('created_at')
console.log('\njewellery_products error:', jErr?.message ?? 'none')
console.log('jewellery_products count:', jewellery?.length)
console.log('jewellery_products columns:', jewellery?.[0] ? Object.keys(jewellery[0]).join(', ') : 'N/A')

// ── Jewellery product media ───────────────────────────────────────────────────
const { data: jmedia, error: jmErr } = await old.from('jewellery_product_media').select('*').order('jewellery_product_id')
console.log('\njewellery_product_media error:', jmErr?.message ?? 'none')
console.log('jewellery_product_media count:', jmedia?.length)
console.log('jewellery_product_media columns:', jmedia?.[0] ? Object.keys(jmedia[0]).join(', ') : 'N/A')

// ── Hero media ────────────────────────────────────────────────────────────────
const { data: hero, error: hErr } = await old.from('hero_media').select('*')
console.log('\nhero_media error:', hErr?.message ?? 'none')
console.log('hero_media count:', hero?.length)

// ── Ring setting diamonds ─────────────────────────────────────────────────────
const { data: rsd, error: rsdErr } = await old.from('ring_setting_diamonds').select('*')
console.log('\nring_setting_diamonds error:', rsdErr?.message ?? 'none')
console.log('ring_setting_diamonds count:', rsd?.length)

// ── Storage: list jewellery-media objects (top level + subfolders) ───────────
console.log('\n── STORAGE: jewellery-media contents ────────────────────────────────')
const { data: jmBucketList } = await old.storage.from('jewellery-media').list('', { limit: 200 })
console.log('Top-level entries:', jmBucketList?.length, jmBucketList?.map(f => f.name))

// Try listing subdirectories
for (const entry of (jmBucketList ?? []).slice(0, 20)) {
  if (!entry.id) {
    // It's a folder
    const { data: sub } = await old.storage.from('jewellery-media').list(entry.name, { limit: 200 })
    console.log(`  ${entry.name}/ →`, sub?.length, 'objects')
    for (const s of (sub ?? []).slice(0, 5)) {
      console.log(`    ${entry.name}/${s.name}`)
    }
  }
}

// ── Write full data to file for migration ────────────────────────────────────
const payload = {
  extractedAt: new Date().toISOString(),
  ringSettings:          ringSettings ?? [],
  ringSettingMedia:      rsmedia ?? [],
  diamonds:              diamonds ?? [],
  jewelleryProducts:     jewellery ?? [],
  jewelleryProductMedia: jmedia ?? [],
  heroMedia:             hero ?? [],
  ringSettingDiamonds:   rsd ?? [],
}
writeFileSync('scripts/old-project-data.json', JSON.stringify(payload, null, 2))
console.log('\nFull data written to scripts/old-project-data.json')
console.log('Total rows to migrate:',
  (ringSettings?.length ?? 0) + (rsmedia?.length ?? 0) + (diamonds?.length ?? 0) +
  (jewellery?.length ?? 0) + (jmedia?.length ?? 0) + (hero?.length ?? 0) + (rsd?.length ?? 0)
)
