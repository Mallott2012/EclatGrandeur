import type { Metadata } from 'next';
import { NecklacesPage } from '@/components/jewellery/NecklacesPage';

export const metadata: Metadata = {
  title: 'Diamond Necklaces & Pendants | Éclat Grandeur',
  description: 'Diamond pendants, rivière necklaces and statement drops — each stone GIA-certified and ethically sourced, handcrafted in our London atelier.',
};

export default function Page() {
  return <NecklacesPage />;
}
