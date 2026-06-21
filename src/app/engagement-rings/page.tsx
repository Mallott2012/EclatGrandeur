import type { Metadata } from 'next';
import { CategoryPage } from '@/components/product/CategoryPage';

export const metadata: Metadata = {
  title: 'Engagement Rings',
  description:
    'Diamond engagement rings hand-finished in our London atelier — solitaires, halos, three-stone and pavé — or design your own around a diamond of exceptional beauty.',
};

export default function Page() {
  return (
    <CategoryPage
      category="engagement-rings"
      eyebrow="The Promise"
      title="Engagement Rings"
      description="A signature design, or a ring created entirely around your diamond. Each one made to last forever."
      bannerSlug="aurora-solitaire-ring"
      showBuilder
    />
  );
}
