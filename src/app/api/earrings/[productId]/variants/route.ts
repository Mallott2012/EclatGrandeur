import { NextResponse }            from 'next/server';
import { listPurchasableVariants } from '@/lib/earrings/variants';

// Availability changes with reservations — never cache this response.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/earrings/[productId]/variants
 *
 * Returns the published, currently-purchasable earring variants for a product.
 * Customer-safe shape only — no SKU, admin notes, stock counts, or hold internals.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    if (!productId) return NextResponse.json({ variants: [] });
    const variants = await listPurchasableVariants(productId);
    return NextResponse.json({ variants });
  } catch {
    return NextResponse.json({ variants: [], error: 'Could not load earring options.' }, { status: 500 });
  }
}
