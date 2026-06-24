import { listRingSettings } from '@/lib/ring-settings/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { METAL_LABELS } from '@/lib/ring-settings/types';
import { RING_STYLES } from '@/lib/catalog/styles';

export default async function AdminRingsPage() {
  const rings = await listRingSettings().catch(() => []);

  const products: AdminProduct[] = rings.map((r) => ({
    id:        r.id,
    slug:      r.slug,
    name:      r.name,
    subtitle:  r.metals.map((m) => METAL_LABELS[m]).join(' · ') || 'Engagement Ring',
    price:     r.base_price_gbp ? `Starting from £${parseFloat(String(r.base_price_gbp)).toLocaleString('en-GB')}` : 'Price on request',
    image:     (r as any).media?.find((m: any) => m.media_type === 'image')?.storage_path ?? (r as any).media?.[0]?.storage_path ?? '',
    video:     (r as any).media?.find((m: any) => m.media_type === 'video' || m.media_type === 'video_360')?.storage_path,
    published: r.is_published,
    editHref:  `/admin/rings/${r.id}`,
  }));

  return (
    <AdminProductGrid
      title="Engagement Rings"
      lede="Crafted to last a lifetime"
      addHref="/admin/rings/new"
      products={products}
      itemLabel="ring"
      styles={RING_STYLES}
    />
  );
}
