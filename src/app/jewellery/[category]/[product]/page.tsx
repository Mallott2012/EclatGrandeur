import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { getAllProductSlugs, getProductBySlug, getProductsBySlugs } from '@/lib/data/products';
import { CATEGORY_LABELS } from '@/types/common';
import { productJsonLd } from '@/lib/seo';

export function generateStaticParams() {
  return getAllProductSlugs().map(({ category, slug }) => ({
    category,
    product: slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { product: string };
}): Metadata {
  const product = getProductBySlug(params.product);
  if (!product) return {};
  return {
    title: product.seo?.title ?? product.name,
    description: product.seo?.description ?? product.description,
  };
}

export default function ProductPage({
  params,
}: {
  params: { category: string; product: string };
}) {
  const product = getProductBySlug(params.product);
  if (!product || product.category !== params.category) notFound();

  const related = getProductsBySlugs(product.related ?? []);

  return (
    <div className="container-luxe py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-luxe text-ink/50">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link href={`/jewellery/${product.category}`} className="hover:text-ink">
          {CATEGORY_LABELS[product.category]}
        </Link>
        <span>/</span>
        <span className="text-ink/80">{product.name}</span>
      </nav>

      <ProductDetailClient product={product} />

      {related.length > 0 && (
        <section className="mt-28">
          <SectionHeading eyebrow="You May Also Admire" title="Complete the Look" className="mb-12" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
