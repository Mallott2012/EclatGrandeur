import type { Metadata } from 'next';
import { CategoryPage } from '@/components/product/CategoryPage';

export const metadata: Metadata = {
  title: 'Wedding Bands',
  description:
    'Diamond eternity bands and classic wedding rings, made to your size in platinum and 18ct gold. The truest symbol there is.',
};

export default function Page() {
  return (
    <CategoryPage
      category="wedding-bands"
      eyebrow="The Vow"
      title="Wedding Bands"
      description="A circle with no beginning and no end. Diamond eternity bands and classic court rings, made to your exact size."
      bannerSlug="eternelle-eternity-band"
    />
  );
}
