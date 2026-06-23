import { listRingSettings } from '@/lib/ring-settings/service';
import { listAllCollageMedia } from '@/app/admin/(console)/hero/actions';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { METAL_LABELS } from '@/lib/ring-settings/types';
import { saveHeroAction, deleteHeroAction } from '@/app/admin/(console)/hero/actions';

export default async function AdminRingsPage() {
  const [rings, collageMedia] = await Promise.all([
    listRingSettings().catch(() => []),
    listAllCollageMedia('engagement-rings').catch(() => []),
  ]);

  const products: AdminProduct[] = rings.map((r) => ({
    id:        r.id,
    slug:      r.slug,
    name:      r.name,
    subtitle:  r.metals.map((m) => METAL_LABELS[m]).join(' · ') || 'Engagement Ring',
    price:     r.base_price_gbp ? `Starting from £${parseFloat(String(r.base_price_gbp)).toLocaleString('en-GB')}` : 'Price on request',
    image:     (r as any).media?.[0]?.storage_path ?? '',
    published: r.is_published,
    editHref:  `/admin/rings/${r.id}`,
  }));

  const collageSlots = Array.from({ length: 6 }, (_, i) => collageMedia[i] ?? null);

  return (
    <AdminProductGrid
      title="Rings"
      heroCopy="Manage your ring collection"
      addHref="/admin/rings/new"
      products={products}
      heroPlacement="engagement-rings"
      collageSlots={collageSlots}
      heroCallbacks={{ onSave: saveHeroAction, onDelete: deleteHeroAction }}
    />
  );
}
