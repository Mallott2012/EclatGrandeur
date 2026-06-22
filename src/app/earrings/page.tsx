import type { Metadata } from 'next';
import { EarringsPage } from '@/components/jewellery/EarringsPage';

export const metadata: Metadata = {
  title: 'Diamond Earrings | Éclat Grandeur',
  description: 'Diamond studs, drop earrings, hoops and chandeliers — perfectly matched GIA-certified stones crafted to catch the light from every angle.',
};

export default function Page() {
  return <EarringsPage />;
}
