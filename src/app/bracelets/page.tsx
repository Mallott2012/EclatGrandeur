import type { Metadata } from 'next';
import { CategoryPage } from '@/components/product/CategoryPage';

export const metadata: Metadata = {
  title: 'Diamond Bracelets',
  description:
    'Diamond tennis bracelets, bangles and line bracelets, hand-articulated for fluid movement and set with matched brilliant diamonds.',
};

export default function Page() {
  return (
    <CategoryPage
      category="bracelets"
      eyebrow="Forever, in Line"
      title="Bracelets"
      description="The unbroken line of a tennis bracelet, the sculpture of a bangle — diamonds that move with the wrist."
      bannerSlug="eternelle-tennis-bracelet"
    />
  );
}
