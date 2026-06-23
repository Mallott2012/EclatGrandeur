import { listJewelleryProducts } from '@/lib/jewellery/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';

export default async function AdminEarringsPage() {
  const products_db = await listJewelleryProducts('earrings').catch(() => []);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Earring',
    price:     `Starting from £${p.base_price_gbp.toLocaleString('en-GB')}`,
    image:     p.media?.[0]?.storage_path ?? '/images/earrings/earring-1.png',
    published: p.is_published,
    editHref:  `/admin/earrings/${p.id}`,
  }));

  return (
    <AdminProductGrid
      title="Earrings"
      heroCopy="Manage your earring collection"
      heroImage="/images/heroes/hero-earrings.png"
      addHref="/admin/earrings/new"
      products={products}
    />
  );
}
