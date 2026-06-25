import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { isEclatEligible, type EligibilityInput } from './eligibility'
import { parseDiamond, type Diamond, type DiamondStatus, type DiamondCategory, type ColourFamily } from './types'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface CompatibleCounts {
  white:  number
  yellow: number
  pink:   number
}

export interface CompatibilitySetting {
  diamond_shapes: string[]
  min_carat:      number | null
  max_carat:      number | null
}

export interface CompatibilityDiamondInput extends EligibilityInput {
  status:           DiamondStatus
  is_published:     boolean
  carat:            number
  diamond_category: DiamondCategory
  colour_family:    ColourFamily | null
}

export interface ListCompatibleOptions {
  ringSettingId:    string
  diamondCategory?: DiamondCategory
  colourFamily?:    ColourFamily
  limit?:           number
  offset?:          number
}

// ── Pure compatibility check (mirrors DB query — testable without DB) ─────────

export function isDiamondCompatibleWith(
  d: CompatibilityDiamondInput,
  setting: CompatibilitySetting,
): boolean {
  if (!d.is_published) return false
  if (d.status !== 'available') return false
  if (!isEclatEligible(d)) return false
  if (setting.diamond_shapes.length > 0 && !setting.diamond_shapes.includes(d.cut)) return false
  if (setting.min_carat !== null && d.carat < setting.min_carat) return false
  if (setting.max_carat !== null && d.carat > setting.max_carat) return false
  // Only White, Yellow, or Pink — no other coloured families
  if (d.diamond_category === 'white') return true
  if (d.diamond_category === 'coloured' && (d.colour_family === 'yellow' || d.colour_family === 'pink')) return true
  return false
}

// ── Internal DB helpers ───────────────────────────────────────────────────────

type AdminClient = ReturnType<typeof createAdminClient>

interface RingConstraints {
  diamond_shapes: string[] | null
  min_carat: string | number | null
  max_carat: string | number | null
}

async function fetchRingConstraints(
  admin: AdminClient,
  ringSettingId: string,
): Promise<RingConstraints | null> {
  const { data } = await admin
    .from('ring_settings')
    .select('diamond_shapes, min_carat, max_carat')
    .eq('id', ringSettingId)
    .maybeSingle()
  return data as RingConstraints | null
}

function parseCaratBound(v: string | number | null): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : parseFloat(v)
  return isNaN(n) ? null : n
}

async function runCountQuery(
  admin: AdminClient,
  shapes: string[],
  minCarat: number | null,
  maxCarat: number | null,
  category: 'white' | 'yellow' | 'pink',
): Promise<number> {
  // Rebuild from scratch each call — avoids Supabase builder type issues
  let q = admin
    .from('diamonds')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('status', 'available')
    .eq('polish', 'excellent')
    .eq('symmetry', 'excellent')
    .eq('fluorescence', 'none')
    .or('and(cut.eq.round,cut_grade.eq.excellent),and(cut.neq.round,eclat_approved.eq.true)')
    .in('cut', shapes)

  if (minCarat !== null) q = q.gte('carat', minCarat)
  if (maxCarat !== null) q = q.lte('carat', maxCarat)

  if (category === 'white') {
    q = q.eq('diamond_category', 'white')
  } else {
    q = q.eq('diamond_category', 'coloured').eq('colour_family', category)
  }

  const { count } = await q
  return count ?? 0
}

// ── Public server functions ───────────────────────────────────────────────────

export async function getCompatibleDiamondCounts(ringSettingId: string): Promise<CompatibleCounts> {
  const admin = createAdminClient()
  const raw = await fetchRingConstraints(admin, ringSettingId)

  if (!raw) return { white: 0, yellow: 0, pink: 0 }

  const shapes = (raw.diamond_shapes ?? []) as string[]
  if (shapes.length === 0) return { white: 0, yellow: 0, pink: 0 }

  const minCarat = parseCaratBound(raw.min_carat)
  const maxCarat = parseCaratBound(raw.max_carat)

  if (minCarat !== null && maxCarat !== null && minCarat > maxCarat) {
    console.warn(
      `[compatibility] Ring setting ${ringSettingId}: min_carat (${minCarat}) exceeds max_carat (${maxCarat}). Returning zero counts.`,
    )
    return { white: 0, yellow: 0, pink: 0 }
  }

  const [white, yellow, pink] = await Promise.all([
    runCountQuery(admin, shapes, minCarat, maxCarat, 'white'),
    runCountQuery(admin, shapes, minCarat, maxCarat, 'yellow'),
    runCountQuery(admin, shapes, minCarat, maxCarat, 'pink'),
  ])

  return { white, yellow, pink }
}

// ── Server-side URL-param validation ─────────────────────────────────────────

/** Fetch a single diamond and verify it is compatible with the given setting.
 *  Returns null when the diamond doesn't exist, is incompatible, ineligible,
 *  unpublished, or sold — safe to call with untrusted URL params. */
export async function getCompatibleDiamondById(
  diamondId: string,
  setting: CompatibilitySetting,
): Promise<Diamond | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('diamonds')
    .select('*')
    .eq('id', diamondId)
    .maybeSingle()

  if (!data) return null
  const diamond = parseDiamond(data)
  if (!isDiamondCompatibleWith(diamond, setting)) return null
  return diamond
}

export async function listCompatibleDiamonds(options: ListCompatibleOptions): Promise<Diamond[]> {
  const { ringSettingId, diamondCategory, colourFamily, limit = 50, offset = 0 } = options
  const admin = createAdminClient()
  const raw = await fetchRingConstraints(admin, ringSettingId)

  if (!raw) return []

  const shapes = (raw.diamond_shapes ?? []) as string[]
  if (shapes.length === 0) return []

  const minCarat = parseCaratBound(raw.min_carat)
  const maxCarat = parseCaratBound(raw.max_carat)

  if (minCarat !== null && maxCarat !== null && minCarat > maxCarat) {
    console.warn(
      `[compatibility] Ring setting ${ringSettingId}: min_carat (${minCarat}) exceeds max_carat (${maxCarat}). Returning empty list.`,
    )
    return []
  }

  let q = admin
    .from('diamonds')
    .select('*')
    .eq('is_published', true)
    .eq('status', 'available')
    .eq('polish', 'excellent')
    .eq('symmetry', 'excellent')
    .eq('fluorescence', 'none')
    .or('and(cut.eq.round,cut_grade.eq.excellent),and(cut.neq.round,eclat_approved.eq.true)')
    .in('cut', shapes)

  if (minCarat !== null) q = q.gte('carat', minCarat)
  if (maxCarat !== null) q = q.lte('carat', maxCarat)

  if (diamondCategory === 'white') {
    q = q.eq('diamond_category', 'white')
  } else if (diamondCategory === 'coloured') {
    q = q.eq('diamond_category', 'coloured')
    if (colourFamily) {
      q = q.eq('colour_family', colourFamily)
    } else {
      q = q.in('colour_family', ['yellow', 'pink'])
    }
  } else {
    // No category filter — return White + Yellow + Pink
    q = q.or('diamond_category.eq.white,and(diamond_category.eq.coloured,colour_family.in.(yellow,pink))')
  }

  q = q.range(offset, offset + limit - 1).order('carat', { ascending: true })

  const { data, error } = await q
  if (error) {
    console.error('[compatibility] listCompatibleDiamonds error:', error)
    return []
  }

  return (data ?? []).map(row => parseDiamond(row))
}
