import { NextResponse } from 'next/server';
import { requireStaffRole } from '@/lib/staff';
import { createRingSetting } from '@/lib/ring-settings/service';

export async function POST(req: Request) {
  try {
    const user = await requireStaffRole([]);
    const body = await req.json();
    const { name, slug, metals, basePrice, description } = body;
    if (!name || !slug || !metals?.length) {
      return NextResponse.json({ error: 'name, slug and metals are required' }, { status: 400 });
    }
    const ring = await createRingSetting(
      {
        name,
        slug,
        metals,
        base_price_gbp: basePrice ?? null,
        description:    description ?? null,
        collection:     null,
        is_published:   false,
        sort_order:     0,
      },
      user.id,
    );
    return NextResponse.json({ id: ring.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
