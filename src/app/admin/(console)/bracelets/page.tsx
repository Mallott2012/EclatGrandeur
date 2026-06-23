import { listJewelleryProducts } from '@/lib/jewellery/service';
import { getPublishedHero } from '@/lib/hero/service';
import { AdminProductGrid, type AdminProduct } from '@/components/admin/AdminProductGrid';
import { saveHeroAction, deleteHeroAction } from '@/app/admin/(console)/hero/actions';

export default async function AdminBraceletsPage() {
  const [products_db, heroRecord] = await Promise.all([
    listJewelleryProducts('bracelets').catch(() => []),
    getPublishedHero('bracelets').catch(() => null),
  ]);

  const products: AdminProduct[] = products_db.map((p) => ({
    id:        p.id,
    slug:      p.slug,
    name:      p.name,
    subtitle:  p.subtitle ?? 'Bracelet',
    price:     `Starting from £${p.base_price_gbp.toLocaleString('en-GB')}`,
    image:     p.media?.[0]?.storage_path ?? '/images/bracelets/bracelet-1.png',
    published: p.is_published,
    editHref:  `/admin/bracelets/${p.id}`,
  }));

  return (
    <AdminProductGrid
      title="Bracelets"
      heroCopy="Manage your bracelet collection"
      heroImage="/images/heroes/hero-bracelets.png"
      addHref="/admin/bracelets/new"
      products={products}
      heroPlacement="bracelets"
      heroRecord={heroRecord}
      heroCallbacks={{ onSave: saveHeroAction, onDelete: deleteHeroAction }}
    />
  );
}
