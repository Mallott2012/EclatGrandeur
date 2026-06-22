import type { Metadata } from 'next';
import { BraceletsPage } from '@/components/jewellery/BraceletsPage';

export const metadata: Metadata = {
  title: 'Diamond Bracelets | Éclat Grandeur',
  description: 'Diamond tennis bracelets, bangles and pavé bracelets — hand-articulated for fluid movement and set with matched brilliant-cut diamonds.',
};

export default function Page() {
  return <BraceletsPage />;
}
