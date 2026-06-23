import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { listCollageMedia } from '@/lib/hero/service';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';

export const metadata: Metadata = {
  title: 'Diamond Bracelets | Éclat Grandeur',
  description: 'Diamond tennis bracelets, bangles and pavé bracelets — hand-articulated for fluid movement and set with matched brilliant-cut diamonds.',
};

const CONFIG_BASE: Omit<JewelleryConfig, 'products' | 'collageSlots'> = {
  title:     'Bracelets',
  heroCopy:  'Diamonds that grace every gesture',
  heroImage: '',
  basePath:  '/bracelets',
  itemLabel: 'bracelet',
  styles: [
    { id: 'tennis',   label: 'Tennis Bracelet' },
    { id: 'bangle',   label: 'Bangle' },
    { id: 'link',     label: 'Link Bracelet' },
    { id: 'pave',     label: 'Pavé Bracelet' },
    { id: 'eternity', label: 'Eternity Bracelet' },
  ],
};

export default async function Page() {
  const [db, collageMedia] = await Promise.all([
    listPublishedJewelleryProducts('bracelets').catch(() => []),
    listCollageMedia('bracelets').catch(() => []),
  ]);
  const products: JewelleryProduct[] = db.map(p => ({
    id:       p.id,
    slug:     p.slug,
    name:     p.name,
    subtitle: p.subtitle ?? '',
    price:    p.base_price_gbp ? `Starting from £${Number(p.base_price_gbp).toLocaleString('en-GB')}` : 'Price on application',
    metals:   p.metals.length,
    style:    '',
    image:    p.media?.[0]?.storage_path ?? '',
  }));
  const collageSlots = Array.from({ length: 6 }, (_, i) => collageMedia[i] ?? null);
  return <JewelleryListingPage config={{ ...CONFIG_BASE, products, collageSlots }} />;
}
