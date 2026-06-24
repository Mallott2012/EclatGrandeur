import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllProductSlugs, getProductBySlug } from '@/lib/data';
import { ProductDetail } from '@/components/product/ProductDetail';
import { priceLabel } from '@/lib/utils';

export function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProductBySlug(params.slug);
  if (!product) return { title: 'Not found' };
  return {
    title: product.name,
    description: `${product.description} ${priceLabel(product.purchase)}.`,
    openGraph: { title: product.name, description: product.description },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
