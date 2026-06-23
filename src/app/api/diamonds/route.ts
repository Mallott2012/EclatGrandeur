import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/diamonds
 *
 * Public route — returns only published diamonds for the DiamondSelector.
 * RLS policies on `diamonds` table enforce `is_published = TRUE` for anon reads.
 *
 * Query params:
 *  - shape (optional): filter by diamond shape (round, oval, etc.)
 *  - min_carat, max_carat, min_price, max_price (optional): range filters
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    // Start building query
    let query = supabase
      .from('diamonds')
      .select('id, sku, carat, cut, colour, clarity, fluorescence, price_gbp, is_published')
      .eq('is_published', true)
      .order('carat', { ascending: true })

    // Optional filters
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
      console.error('[v0] /api/diamonds error:', error)
      return NextResponse.json({ error: 'Failed to fetch diamonds' }, { status: 500 })
    }

    // Transform DB records to frontend shape (British English column names → frontend keys)
    const diamonds = (data ?? []).map((d) => ({
      id: d.id,
      sku: d.sku,
      carat: d.carat,
      shape: d.cut,         // DB uses 'cut' for shape
      color: d.colour,      // British → American
      clarity: d.clarity,
      fluorescence: d.fluorescence,
      price: Math.round(d.price_gbp * 100), // Convert GBP to pence for frontend
    }))

    return NextResponse.json({ diamonds })
  } catch (err) {
    console.error('[v0] /api/diamonds unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
