import { listRingSettings } from '@/lib/ring-settings/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { METAL_LABELS } from '@/lib/ring-settings/types';

export default async function AdminRingsPage() {
  const rings = await listRingSettings().catch(() => []);

  const products: AdminProduct[] = rings.map((r) => ({
    id:        r.id,
    slug:      r.slug,
    name:      r.name,
    subtitle:  r.metals.map((m) => METAL_LABELS[m]).join(' · ') || 'Engagement Ring',
    price:     r.base_price_gbp ? `Starting from £${parseFloat(r.base_price_gbp).toLocaleString('en-GB')}` : 'Price on request',
    image:     '/images/rings/ring-1.png',
    published: r.is_published,
    editHref:  `/admin/rings/${r.id}`,
  }));

  return (
    <AdminProductGrid
      title="Rings"
      heroCopy="Manage your ring collection"
      heroImage="/images/heroes/hero-engagement-rings.png"
      addHref="/admin/rings/new"
      products={products}
    />
  );
}
