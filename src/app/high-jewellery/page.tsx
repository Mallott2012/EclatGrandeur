import type { Metadata } from 'next';
import { CategoryPage } from '@/components/product/CategoryPage';

export const metadata: Metadata = {
  title: 'High Jewellery',
  description:
    'One-of-a-kind high jewellery creations, built around the rarest stones and presented by private appointment only.',
};

export default function Page() {
  return (
    <CategoryPage
      category="high-jewellery"
      eyebrow="The Exceptional"
      title="High Jewellery"
      description="Singular creations built around the rarest of stones. Each piece is unique, and presented by private appointment."
      bannerSlug="monarch-emerald-necklace"
    />
  );
}
