import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CategoryView } from '@/components/filters/CategoryView';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { getProductsByCategory } from '@/lib/data/products';
import { CATEGORY_LABELS, type Category } from '@/types/common';

const VALID: Category[] = [
  'engagement-rings',
  'necklaces',
  'bracelets',
  'earrings',
  'wedding-bands',
  'high-jewellery',
];

const INTROS: Partial<Record<Category, string>> = {
  necklaces: 'Pendants and rivières that draw the eye to the décolletage.',
  bracelets: 'From the timeless tennis line to delicate everyday diamonds.',
  earrings: 'Studs, drops and hoops, each set with diamonds of exacting match.',
  'wedding-bands': 'A continuous line of diamonds — devotion without end.',
  'high-jewellery': 'Singular creations, presented by private appointment.',
  'engagement-rings': 'The most important ring you will ever choose.',
};

export function generateStaticParams() {
  return VALID.map((category) => ({ category }));
}

export function generateMetadata({
  params,
}: {
  params: { category: string };
}): Metadata {
  const category = params.category as Category;
  if (!VALID.includes(category)) return {};
  return { title: CATEGORY_LABELS[category] };
}

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = params.category as Category;
  if (!VALID.includes(category)) notFound();

  const products = getProductsByCategory(category);

  return (
    <div className="container-luxe py-16">
      <SectionHeading
        as="h1"
        eyebrow="Jewellery"
        title={CATEGORY_LABELS[category]}
        description={INTROS[category]}
        className="mb-12"
      />
      <CategoryView products={products} />
    </div>
  );
}
