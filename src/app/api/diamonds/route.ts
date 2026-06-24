import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/diamonds
 *
 * Public route — returns only published diamonds for the DiamondSelector.
 *
 * Query params:
 *  - shape (optional): filter by diamond shape (round, oval, etc.)
 *  - min_carat, max_carat, min_price, max_price (optional): range filters
 *  - ring_setting_id + metal (optional): restrict to diamonds assigned to this
 *    ring setting + metal combination via the ring_setting_diamonds join table
 *  - jewellery_id (optional): restrict to diamonds assigned to this jewellery
 *    product via the jewellery_diamonds join table
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const ringSettingId = searchParams.get('ring_setting_id')
    const metal         = searchParams.get('metal')
    const jewelleryId   = searchParams.get('jewellery_id')

    // ── If scoped, fetch assigned diamond IDs first ───────────────────────────
    let assignedIds: string[] | null = null

    if (ringSettingId && metal) {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('ring_setting_diamonds')
        .select('diamond_id')
        .eq('ring_setting_id', ringSettingId)
        .eq('metal', metal)
      if (error) return NextResponse.json({ error: 'Failed to fetch assigned diamonds' }, { status: 500 })
      const ids = (data ?? []).map((r: { diamond_id: string }) => r.diamond_id)
      // Only scope if assignments exist; otherwise fall through to all published diamonds
      if (ids.length > 0) assignedIds = ids
    }

    if (jewelleryId) {
      const admin = createAdminClient()
      const { data, error } = await admin
        .from('jewellery_diamonds')
        .select('diamond_id')
        .eq('jewellery_id', jewelleryId)
      if (error) return NextResponse.json({ error: 'Failed to fetch assigned diamonds' }, { status: 500 })
      const ids = (data ?? []).map((r: { diamond_id: string }) => r.diamond_id)
      if (ids.length > 0) assignedIds = ids
    }

    // ── Build main diamond query ──────────────────────────────────────────────
    let query = supabase
      .from('diamonds')
      .select('id, sku, carat, cut, colour, clarity, fluorescence, price_gbp, is_published')
      .eq('is_published', true)
      .order('carat', { ascending: true })

    // Scope to assigned IDs when filtering by product
    if (assignedIds !== null) {
      query = query.in('id', assignedIds)
    }

    // Optional range filters
    const shape = searchParams.get('shape')
    if (shape) query = query.eq('cut', shape)

    const minCarat = searchParams.get('min_carat')
    if (minCarat) query = query.gte('carat', parseFloat(minCarat))

    const maxCarat = searchParams.get('max_carat')
    if (maxCarat) query = query.lte('carat', parseFloat(maxCarat))

    const minPrice = searchParams.get('min_price')
    if (minPrice) query = query.gte('price_gbp', parseFloat(minPrice))

    const maxPrice = searchParams.get('max_price')
    if (maxPrice) query = query.lte('price_gbp', parseFloat(maxPrice))

    const { data, error } = await query

    if (error) {
      console.error('[api/diamonds] error:', error)
      return NextResponse.json({ error: 'Failed to fetch diamonds' }, { status: 500 })
    }

    // Transform DB records to frontend shape
    const diamonds = (data ?? []).map((d) => ({
      id:           d.id,
      sku:          d.sku,
      carat:        parseFloat(d.carat as unknown as string),
      shape:        d.cut,
      color:        d.colour,
      clarity:      d.clarity,
      fluorescence: d.fluorescence,
      price:        parseFloat(d.price_gbp as unknown as string),
    }))

    return NextResponse.json({ diamonds })
  } catch (err) {
    console.error('[api/diamonds] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
