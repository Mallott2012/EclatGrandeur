import { NextResponse } from 'next/server';
import { requireStaffRole } from '@/lib/staff';
import { createJewelleryProduct } from '@/lib/jewellery/service';

export async function POST(req: Request) {
  try {
    const user = await requireStaffRole([]);
    const body = await req.json();
    const { name, slug, metals, basePrice, description } = body;
    if (!name || !slug || !metals?.length) {
      return NextResponse.json({ error: 'name, slug and metals are required' }, { status: 400 });
    }
    const product = await createJewelleryProduct(user, {
      name,
      slug,
      category:       'necklaces',
      metals,
      base_price_gbp: basePrice ?? 0,
      description:    description ?? null,
      subtitle:       null,
      is_published:   false,
      sort_order:     0,
      show_diamond:   true,
      is_total_carat: false,
      is_pair:        false,
    });
    return NextResponse.json({ id: product.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
