import { listJewelleryProducts } from '@/lib/jewellery/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';

export default async function AdminNecklacesPage() {
  const products_db = await listJewelleryProducts('necklaces').catch(() => []);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Necklace',
    price:     p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    image:     p.media?.[0]?.storage_path ?? '',
    published: p.is_published,
    editHref:  `/admin/necklaces/${p.id}`,
  }));

  return (
    <AdminProductGrid
      title="Necklaces"
      lede="Diamonds to be worn close to the heart"
      addHref="/admin/necklaces/new"
      products={products}
      itemLabel="necklace"
    />
  );
}
