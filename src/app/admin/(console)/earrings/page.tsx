import { listJewelleryProducts } from '@/lib/jewellery/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { EARRING_STYLES } from '@/lib/catalog/styles';

export default async function AdminEarringsPage() {
  const products_db = await listJewelleryProducts('earrings').catch(() => []);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Earring',
    price:     p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    image:     p.media?.find((m: any) => m.media_type === 'image')?.storage_path ?? p.media?.[0]?.storage_path ?? '',
    video:     p.media?.find((m: any) => m.media_type === 'video' || m.media_type === 'video_360')?.storage_path,
    published: p.is_published,
    editHref:  `/admin/earrings/${p.id}`,
  }));

  return (
    <AdminProductGrid
      title="Earrings"
      lede="The finest diamonds, perfectly matched"
      addHref="/admin/earrings/new"
      products={products}
      itemLabel="earring"
      styles={EARRING_STYLES}
    />
  );
}
