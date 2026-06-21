import type { Metadata } from 'next';
import { CategoryPage } from '@/components/product/CategoryPage';

export const metadata: Metadata = {
  title: 'Diamond Necklaces & Pendants',
  description:
    'Diamond pendants and rivière necklaces, from everyday solitaires to high jewellery statements. Each stone GIA-certified and ethically sourced.',
};

export default function Page() {
  return (
    <CategoryPage
      category="necklaces"
      eyebrow="The Décolletage"
      title="Necklaces"
      description="A single diamond at the throat, or a river of them. Pieces that draw the eye and never leave the skin."
      bannerSlug="sovereign-riviere-necklace"
    />
  );
}
