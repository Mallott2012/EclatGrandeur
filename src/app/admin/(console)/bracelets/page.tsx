import { listJewelleryProducts } from '@/lib/jewellery/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';

export default async function AdminBraceletsPage() {
  const products_db = await listJewelleryProducts('bracelets').catch(() => []);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Bracelet',
    price:     p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    image:     p.media?.find((m: any) => m.media_type === 'image')?.storage_path ?? p.media?.[0]?.storage_path ?? '',
    video:     p.media?.find((m: any) => m.media_type === 'video' || m.media_type === 'video_360')?.storage_path,
    published: p.is_published,
    editHref:  `/admin/bracelets/${p.id}`,
  }));

  return (
    <AdminProductGrid
      title="Bracelets"
      lede="Diamonds that grace every gesture"
      addHref="/admin/bracelets/new"
      products={products}
      itemLabel="bracelet"
    />
  );
}
