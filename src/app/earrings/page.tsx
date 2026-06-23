import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { METAL_LABELS } from '@/lib/diamonds/types';
import { EarringsPage } from '@/components/jewellery/EarringsPage';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';

export const metadata: Metadata = {
  title: 'Diamond Earrings | Éclat Grandeur',
  description: 'Diamond studs, drop earrings, hoops and chandeliers — perfectly matched GIA-certified stones crafted to catch the light from every angle.',
};

const BASE_CONFIG = {
  title:     'Earrings',
  heroCopy:  'The finest diamonds, perfectly matched',
  heroImage: '/images/heroes/hero-earrings.png',
  basePath:  '/earrings',
  itemLabel: 'earring',
  styles: [
    { id: 'stud',       label: 'Stud Earrings' },
    { id: 'drop',       label: 'Drop Earrings' },
    { id: 'halo',       label: 'Halo Earrings' },
    { id: 'chandelier', label: 'Chandelier' },
    { id: 'hoop',       label: 'Hoop Earrings' },
  ],
};

export default async function Page() {
  try {
    const dbProducts = await listPublishedJewelleryProducts('earrings');
    if (dbProducts.length > 0) {
      const products: JewelleryProduct[] = dbProducts.map((p) => ({
        id:       p.id,
        slug:     p.slug,
        name:     p.name,
        subtitle: p.subtitle ?? '',
        price:    `Starting from £${p.base_price_gbp.toLocaleString('en-GB')}`,
        metals:   p.metals.length,
        style:    '',
        image:    p.media[0]?.storage_path ?? '/images/earrings/earring-1.png',
      }));
      const config: JewelleryConfig = { ...BASE_CONFIG, products };
      return <JewelleryListingPage config={config} />;
    }
  } catch {
    // Fall through to static fallback
  }
  return <EarringsPage />;
}
