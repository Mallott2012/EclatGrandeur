import { listJewelleryProducts } from '@/lib/jewellery/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';

export default async function AdminNecklacesPage() {
  const products_db = await listJewelleryProducts('necklaces').catch(() => []);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Necklace',
    price:     `Starting from £${p.base_price_gbp.toLocaleString('en-GB')}`,
    image:     p.media?.[0]?.storage_path ?? '/images/necklaces/necklace-1.png',
    published: p.is_published,
    editHref:  `/admin/necklaces/${p.id}`,
  }));

  return (
    <AdminProductGrid
      title="Necklaces"
      heroCopy="Manage your necklace collection"
      heroImage="/images/heroes/hero-necklaces.png"
      addHref="/admin/necklaces/new"
      products={products}
    />
  );
}
