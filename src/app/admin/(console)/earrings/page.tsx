import { listJewelleryProducts } from '@/lib/jewellery/service';
import { listAllCollageMedia } from '@/app/admin/(console)/hero/actions';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { saveHeroAction, deleteHeroAction } from '@/app/admin/(console)/hero/actions';

export default async function AdminEarringsPage() {
  const [products_db, collageMedia] = await Promise.all([
    listJewelleryProducts('earrings').catch(() => []),
    listAllCollageMedia('earrings').catch(() => []),
  ]);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Earring',
    price:     p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    image:     p.media?.[0]?.storage_path ?? '',
    published: p.is_published,
    editHref:  `/admin/earrings/${p.id}`,
  }));

  const collageSlots = Array.from({ length: 6 }, (_, i) => collageMedia[i] ?? null);

  return (
    <AdminProductGrid
      title="Earrings"
      heroCopy="Manage your earring collection"
      addHref="/admin/earrings/new"
      products={products}
      heroPlacement="earrings"
      collageSlots={collageSlots}
      heroCallbacks={{ onSave: saveHeroAction, onDelete: deleteHeroAction }}
    />
  );
}
