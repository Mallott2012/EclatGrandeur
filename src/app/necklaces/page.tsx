import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { NecklacesPage } from '@/components/jewellery/NecklacesPage';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';

export const metadata: Metadata = {
  title: 'Diamond Necklaces & Pendants | Éclat Grandeur',
  description: 'Diamond pendants, rivière necklaces and statement drops — each stone GIA-certified and ethically sourced, handcrafted in our London atelier.',
};

const BASE_CONFIG = {
  title:     'Necklaces',
  heroCopy:  'Diamonds to be worn close to the heart',
  heroImage: '/images/heroes/hero-necklaces.png',
  basePath:  '/necklaces',
  itemLabel: 'necklace',
  styles: [
    { id: 'solitaire', label: 'Solitaire Pendant' },
    { id: 'riviere',   label: 'Rivière' },
    { id: 'halo',      label: 'Halo Pendant' },
    { id: 'drop',      label: 'Drop Pendant' },
    { id: 'bar',       label: 'Bar Necklace' },
  ],
};

export default async function Page() {
  try {
    const dbProducts = await listPublishedJewelleryProducts('necklaces');
    if (dbProducts.length > 0) {
      const products: JewelleryProduct[] = dbProducts.map((p) => ({
        id:       p.id,
        slug:     p.slug,
        name:     p.name,
        subtitle: p.subtitle ?? '',
        price:    `Starting from £${p.base_price_gbp.toLocaleString('en-GB')}`,
        metals:   p.metals.length,
        style:    '',
        image:    p.media[0]?.storage_path ?? '/images/necklaces/necklace-1.png',
      }));
      const config: JewelleryConfig = { ...BASE_CONFIG, products };
      return <JewelleryListingPage config={config} />;
    }
  } catch {
    // Fall through to static fallback
  }
  return <NecklacesPage />;
}
