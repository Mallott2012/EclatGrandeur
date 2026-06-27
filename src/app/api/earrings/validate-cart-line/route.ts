import { NextResponse }    from 'next/server';
import { isPairHoldValid } from '@/lib/pairs/reservation';

/**
 * POST /api/earrings/validate-cart-line
 *
 * Validates that every pair reservation in an earring cart line is still active
 * for the given cart token. Called on cart page load / refresh.
 *
 * Body: { pairIds: string[], cartToken: string }
 * Returns: { valid: boolean, reason?: string }
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ valid: false, reason: 'Invalid request' }, { status: 400 }); }

    const raw = body as Record<string, unknown>;
    const pairIds   = raw.pairIds;
    const cartToken = raw.cartToken;

    if (!Array.isArray(pairIds) || typeof cartToken !== 'string') {
      return NextResponse.json({ valid: false, reason: 'Invalid request' }, { status: 400 });
    }

    const validIds = pairIds.filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (validIds.length === 0) {
      return NextResponse.json({ valid: true });
    }

    const holdChecks = await Promise.all(
      validIds.map(id => isPairHoldValid(id, cartToken).catch(() => false)),
    );

    const allValid = holdChecks.every(h => h);

    return NextResponse.json({
      valid:  allValid,
      reason: allValid
        ? undefined
        : 'Your selected diamond pair is no longer reserved. Please review your selection.',
    });
  } catch {
    return NextResponse.json({ valid: false, reason: 'Could not validate reservation' }, { status: 500 });
  }
}
