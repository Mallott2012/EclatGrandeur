import { NextResponse }    from 'next/server';
import { releaseVariant }  from '@/lib/earrings/variants';

/**
 * POST /api/earrings/release
 *
 * Releases the reservation hold on an earring variant when removed from the bag.
 * Wrong-token calls are silent no-ops (DB function guards ownership).
 * Idempotent — safe on already-released / made-to-order variants.
 *
 * Body: { variantId: string, cartToken: string }
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 }); }

    const raw = body as Record<string, unknown>;
    const variantId = raw.variantId;
    const cartToken = raw.cartToken;

    if (typeof variantId !== 'string' || typeof cartToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'variantId and cartToken are required' }, { status: 400 });
    }

    await releaseVariant(variantId, cartToken).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to release reservation' }, { status: 500 });
  }
}
