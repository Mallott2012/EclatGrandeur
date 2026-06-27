import { NextResponse }  from 'next/server';
import { releasePair }   from '@/lib/pairs/reservation';

/**
 * POST /api/earrings/release
 *
 * Releases all pair reservations belonging to a configured earring cart item.
 * Wrong-token calls are silent no-ops (DB function guards ownership).
 * Idempotent — safe to call on already-expired or already-released pairs.
 *
 * Body: { pairIds: string[], cartToken: string }
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 }); }

    const raw = body as Record<string, unknown>;
    const pairIds   = raw.pairIds;
    const cartToken = raw.cartToken;

    if (!Array.isArray(pairIds) || typeof cartToken !== 'string') {
      return NextResponse.json({ ok: false, error: 'pairIds (array) and cartToken (string) are required' }, { status: 400 });
    }

    const validIds = pairIds.filter((id): id is string => typeof id === 'string' && id.length > 0);

    // Release all pairs in parallel; wrong-token or expired pairs are silent no-ops
    await Promise.all(validIds.map(id => releasePair(id, cartToken).catch(() => {})));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to release reservations' }, { status: 500 });
  }
}
