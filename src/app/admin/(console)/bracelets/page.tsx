import { listJewelleryProducts } from '@/lib/jewellery/service';
import { listAllCollageMedia } from '@/app/admin/(console)/hero/actions';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { saveHeroAction, deleteHeroAction } from '@/app/admin/(console)/hero/actions';

export default async function AdminBraceletsPage() {
  const [products_db, collageMedia] = await Promise.all([
    listJewelleryProducts('bracelets').catch(() => []),
    listAllCollageMedia('bracelets').catch(() => []),
  ]);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Bracelet',
    price:     p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    image:     p.media?.[0]?.storage_path ?? '',
    published: p.is_published,
    editHref:  `/admin/bracelets/${p.id}`,
  }));

  const collageSlots = Array.from({ length: 6 }, (_, i) => collageMedia[i] ?? null);

  return (
    <AdminProductGrid
      title="Bracelets"
      heroCopy="Manage your bracelet collection"
      addHref="/admin/bracelets/new"
      products={products}
      heroPlacement="bracelets"
      collageSlots={collageSlots}
      heroCallbacks={{ onSave: saveHeroAction, onDelete: deleteHeroAction }}
    />
  );
}
