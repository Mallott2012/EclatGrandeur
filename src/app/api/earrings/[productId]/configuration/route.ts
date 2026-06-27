import { NextResponse } from 'next/server';
import { validateEarringConfiguration, calculateEarringConfigurationPrice } from '@/lib/earrings/configuration';
import type { EarringConfigurationInput } from '@/lib/earrings/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const raw = body as Record<string, unknown>;
    const selectedPairsRaw = raw.selectedPairs;
    if (!Array.isArray(selectedPairsRaw)) {
      return NextResponse.json({ error: 'selectedPairs must be an array' }, { status: 400 });
    }

    const selectedPairs = selectedPairsRaw
      .filter((sp): sp is { slotKey: string; pairId: string } =>
        typeof sp === 'object' && sp !== null &&
        typeof (sp as Record<string, unknown>).slotKey === 'string' &&
        typeof (sp as Record<string, unknown>).pairId === 'string',
      )
      .map(sp => ({ slotKey: sp.slotKey, pairId: sp.pairId }));

    const input: EarringConfigurationInput = {
      jewelleryProductId: productId,
      metalVariantId:     typeof raw.metalVariantId === 'string' ? raw.metalVariantId : undefined,
      selectedPairs,
    };

    const validation = await validateEarringConfiguration(input);
    if (!validation.valid) {
      return NextResponse.json({ valid: false, errors: validation.errors });
    }

    const price = await calculateEarringConfigurationPrice(input);
    return NextResponse.json({ valid: true, errors: [], price });
  } catch {
    return NextResponse.json({ error: 'Failed to validate configuration' }, { status: 500 });
  }
}
