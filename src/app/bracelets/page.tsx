import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { BraceletsPage } from '@/components/jewellery/BraceletsPage';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';

export const metadata: Metadata = {
  title: 'Diamond Bracelets | Éclat Grandeur',
  description: 'Diamond tennis bracelets, bangles and pavé bracelets — hand-articulated for fluid movement and set with matched brilliant-cut diamonds.',
};

const BASE_CONFIG = {
  title:     'Bracelets',
  heroCopy:  'Diamonds that grace every gesture',
  heroImage: '/images/heroes/hero-bracelets.png',
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
  try {
    const dbProducts = await listPublishedJewelleryProducts('bracelets');
    if (dbProducts.length > 0) {
      const products: JewelleryProduct[] = dbProducts.map((p) => ({
        id:       p.id,
        slug:     p.slug,
        name:     p.name,
        subtitle: p.subtitle ?? '',
        price:    `Starting from £${p.base_price_gbp.toLocaleString('en-GB')}`,
        metals:   p.metals.length,
        style:    '',
        image:    p.media[0]?.storage_path ?? '/images/bracelets/bracelet-1.png',
      }));
      const config: JewelleryConfig = { ...BASE_CONFIG, products };
      return <JewelleryListingPage config={config} />;
    }
  } catch {
    // Fall through to static fallback
  }
  return <BraceletsPage />;
}
