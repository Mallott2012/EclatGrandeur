import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { listCollageMedia } from '@/lib/hero/service';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';

export const metadata: Metadata = {
  title: 'Diamond Earrings | Éclat Grandeur',
  description: 'Diamond studs, drop earrings, hoops and chandeliers — perfectly matched GIA-certified stones crafted to catch the light from every angle.',
};

const CONFIG_BASE: Omit<JewelleryConfig, 'products' | 'collageSlots'> = {
  title:     'Earrings',
  heroCopy:  'The finest diamonds, perfectly matched',
  heroImage: '',
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
  const [db, collageMedia] = await Promise.all([
    listPublishedJewelleryProducts('earrings').catch(() => []),
    listCollageMedia('earrings').catch(() => []),
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
