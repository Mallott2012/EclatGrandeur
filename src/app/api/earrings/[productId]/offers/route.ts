import { NextResponse }        from 'next/server';
import { listPublishedOffers } from '@/lib/earrings/offers';

// Offer availability/pricing is admin-editable and must reflect changes immediately.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/earrings/[productId]/offers?metal=<metalKey>
 *
 * Returns published, purchasable Earring Diamond Offers for a product, customer-safe.
 * No SKU, admin notes, or internal metadata. Never reads the diamonds table.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    if (!productId) return NextResponse.json({ offers: [] });
    const metal = new URL(request.url).searchParams.get('metal');
    const offers = await listPublishedOffers(productId, metal);
    return NextResponse.json({ offers });
  } catch {
    return NextResponse.json({ offers: [], error: 'Could not load earring options.' }, { status: 500 });
  }
}
