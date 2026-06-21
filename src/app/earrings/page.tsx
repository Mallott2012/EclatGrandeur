import type { Metadata } from 'next';
import { CategoryPage } from '@/components/product/CategoryPage';

export const metadata: Metadata = {
  title: 'Diamond Earrings',
  description:
    'Diamond stud, drop and hoop earrings, set with perfectly matched GIA-certified stones. Crafted to catch the light from every angle.',
};

export default function Page() {
  return (
    <CategoryPage
      category="earrings"
      eyebrow="Brilliance, Worn"
      title="Earrings"
      description="From the perfect pair of studs to high jewellery drops — diamonds that frame the face and catch every light."
      bannerSlug="cascade-drop-earrings"
    />
  );
}
