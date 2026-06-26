import { NextResponse }         from 'next/server';
import { isVariantPurchasable } from '@/lib/earrings/variants';

/**
 * POST /api/earrings/validate-cart-line
 *
 * Validates that an earring variant in a cart line still exists and remains
 * purchasable for the given cart token. Called on cart page load / refresh.
 *
 * Body: { productId: string, variantId: string, cartToken: string }
 * Returns: { valid: boolean, reason?: string }
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ valid: false, reason: 'Invalid request' }, { status: 400 }); }

    const raw = body as Record<string, unknown>;
    const productId = raw.productId;
    const variantId = raw.variantId;
    const cartToken = raw.cartToken;

    if (typeof productId !== 'string' || typeof variantId !== 'string' || typeof cartToken !== 'string') {
      return NextResponse.json({ valid: false, reason: 'Invalid request' }, { status: 400 });
    }

    const result = await isVariantPurchasable(productId, variantId, cartToken);
    return NextResponse.json({ valid: result.valid, reason: result.valid ? undefined : result.reason });
  } catch {
    return NextResponse.json({ valid: false, reason: 'Could not validate reservation' }, { status: 500 });
  }
}
