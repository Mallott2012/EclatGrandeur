import { NextResponse } from 'next/server';
import { listCompatiblePairsForSlot } from '@/lib/earrings/configuration';

// Pair availability changes with reservations — never cache this response.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string; slotKey: string }> },
) {
  try {
    const { productId, slotKey } = await params;
    if (!productId || !slotKey) {
      return NextResponse.json({ error: 'Missing productId or slotKey' }, { status: 400 });
    }
    const pairs = await listCompatiblePairsForSlot({ jewelleryProductId: productId, slotKey });
    return NextResponse.json({ pairs });
  } catch {
    return NextResponse.json({ error: 'Failed to load compatible pairs' }, { status: 500 });
  }
}
