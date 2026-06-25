import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// Parse .env.local
const raw = readFileSync('.env.local', 'utf8')
const env = {}
for (const line of raw.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i < 0) continue
  const k = t.slice(0, i).trim()
  let v = t.slice(i + 1).trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1)
  }
  env[k] = v
}

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Count rows in key tables
const [diamonds, settings, enquiries] = await Promise.all([
  client.from('diamonds').select('id, diamond_category, eclat_approved, polish, symmetry, fluorescence, cut_grade, cut, status, is_published', { count: 'exact' }).limit(5),
  client.from('ring_settings').select('id, name, status', { count: 'exact' }).limit(5),
  client.from('enquiries').select('id', { count: 'exact' }).limit(1),
])

console.log('Diamonds:', JSON.stringify({ count: diamonds.count, error: diamonds.error?.message, sample: diamonds.data?.slice(0,2) }, null, 2))
console.log('Ring settings:', JSON.stringify({ count: settings.count, error: settings.error?.message, sample: settings.data?.slice(0,2) }, null, 2))
console.log('Enquiries:', JSON.stringify({ count: enquiries.count, error: enquiries.error?.message }, null, 2))
