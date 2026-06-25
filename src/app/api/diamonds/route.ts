import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { listCompatibleDiamonds } from '@/lib/diamonds/compatibility'
import type { DiamondCategory, ColourFamily } from '@/lib/diamonds/types'

/**
 * GET /api/diamonds
 *
 * Two paths:
 *
 * 1. Compatibility path (Phase 3+): ring_setting_id without metal
 *    Params: ring_setting_id, category (white|coloured), colour_family (yellow|pink)
 *    Returns only compatible, published, available, Éclat-eligible diamonds.
 *    Never exposes internal approval fields, hold data, or audit metadata.
 *
 * 2. Legacy path: ring_setting_id + metal  OR  jewellery_id
 *    Restricts to diamonds manually assigned via the join table.
 *    Kept for backward compatibility with existing jewellery-product pages.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ringSettingId  = searchParams.get('ring_setting_id')
    const metal          = searchParams.get('metal')
    const jewelleryId    = searchParams.get('jewellery_id')

    // ── 1. Compatibility path ─────────────────────────────────────────────────
    if (ringSettingId && !metal && !jewelleryId) {
      const category     = searchParams.get('category')    as DiamondCategory | null
      const colourFamily = searchParams.get('colour_family') as ColourFamily   | null

      const diamonds = await listCompatibleDiamonds({
        ringSettingId,
        diamondCategory: category     ?? undefined,
        colourFamily:    colourFamily ?? undefined,
        limit:  200,
        offset: 0,
      })

      // Return only customer-safe fields — no approval users, notes, or hold data
      return NextResponse.json({
        diamonds: diamonds.map(d => ({
          id:               d.id,
          sku:              d.sku,
          carat:            d.carat,
          shape:            d.cut,
          color:            d.colour,
          clarity:          d.clarity,
          fluorescence:     d.fluorescence,
          price:            d.price_gbp,
          diamond_category: d.diamond_category,
          colour_family:    d.colour_family,
          colour_intensity: d.colour_intensity,
          colour_description: d.colour_description,
          gia_report_url:   d.gia_report_url,
          cut_grade:        d.cut_grade,
          polish:           d.polish,
          symmetry:         d.symmetry,
        })),
      })
    }

    // ── 2. Legacy path ────────────────────────────────────────────────────────
    const admin = createAdminClient()
    let assignedIds: string[] | null = null

    if (ringSettingId && metal) {
      const { data, error } = await admin
        .from('ring_setting_diamonds')
        .select('diamond_id')
        .eq('ring_setting_id', ringSettingId)
        .eq('metal', metal)
      if (error) return NextResponse.json({ error: 'Failed to fetch assigned diamonds' }, { status: 500 })
      const ids = (data ?? []).map((r: { diamond_id: string }) => r.diamond_id)
      if (ids.length > 0) assignedIds = ids
    }

    if (jewelleryId) {
      const { data, error } = await admin
        .from('jewellery_diamonds')
        .select('diamond_id')
        .eq('jewellery_id', jewelleryId)
      if (error) return NextResponse.json({ error: 'Failed to fetch assigned diamonds' }, { status: 500 })
      const ids = (data ?? []).map((r: { diamond_id: string }) => r.diamond_id)
      if (ids.length > 0) assignedIds = ids
    }

    let query = admin
      .from('diamonds')
      .select('id, sku, carat, cut, colour, clarity, fluorescence, price_gbp, is_published')
      .eq('is_published', true)
      .order('carat', { ascending: true })

    if (assignedIds !== null) query = query.in('id', assignedIds)

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

    return NextResponse.json({
      diamonds: (data ?? []).map(d => ({
        id:           d.id,
        sku:          d.sku,
        carat:        parseFloat(d.carat as unknown as string),
        shape:        d.cut,
        color:        d.colour,
        clarity:      d.clarity,
        fluorescence: d.fluorescence,
        price:        parseFloat(d.price_gbp as unknown as string),
      })),
    })
  } catch (err) {
    console.error('[api/diamonds] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
