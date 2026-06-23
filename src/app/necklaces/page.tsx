import type { Metadata } from 'next';
import { listPublishedJewelleryProducts } from '@/lib/jewellery/service';
import { JewelleryListingPage, type JewelleryProduct, type JewelleryConfig } from '@/components/jewellery/JewelleryListingPage';

export const metadata: Metadata = {
  title: 'Diamond Necklaces & Pendants | Éclat Grandeur',
  description: 'Diamond pendants, rivière necklaces and statement drops — each stone GIA-certified and ethically sourced, handcrafted in our London atelier.',
};

const CONFIG_BASE: Omit<JewelleryConfig, 'products'> = {
  title:        'Necklaces',
  heroCopy:     'Diamonds to be worn close to the heart',
  heroImage:    '',
  basePath:     '/necklaces',
  itemLabel:    'necklace',
  collageSlots: [],
  styles: [
    { id: 'solitaire', label: 'Solitaire Pendant' },
    { id: 'riviere',   label: 'Rivière' },
    { id: 'halo',      label: 'Halo Pendant' },
    { id: 'drop',      label: 'Drop Pendant' },
    { id: 'bar',       label: 'Bar Necklace' },
  ],
};

export default async function Page() {
  const db = await listPublishedJewelleryProducts('necklaces').catch(() => []);
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
  return <JewelleryListingPage config={{ ...CONFIG_BASE, products }} />;
}
