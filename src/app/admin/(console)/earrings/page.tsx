import { listJewelleryProducts } from '@/lib/jewellery/service';
import { getPublishedHero } from '@/lib/hero/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { saveHeroAction, deleteHeroAction } from '@/app/admin/(console)/hero/actions';

export default async function AdminEarringsPage() {
  const [products_db, heroRecord] = await Promise.all([
    listJewelleryProducts('earrings').catch(() => []),
    getPublishedHero('earrings').catch(() => null),
  ]);

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
      heroPlacement="earrings"
      heroRecord={heroRecord}
      heroCallbacks={{ onSave: saveHeroAction, onDelete: deleteHeroAction }}
    />
  );
}
