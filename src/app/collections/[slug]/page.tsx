import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { ProductGrid } from '@/components/product/ProductGrid';
import { getCollectionBySlug, getCollections } from '@/lib/data/collections';
import { getProductsBySlugs } from '@/lib/data/products';

export function generateStaticParams() {
  return getCollections().map((c) => ({ slug: c.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const c = getCollectionBySlug(params.slug);
  if (!c) return {};
  return { title: c.name, description: c.description };
}

export default function CollectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const collection = getCollectionBySlug(params.slug);
  if (!collection) notFound();

  const products = getProductsBySlugs(collection.productSlugs);

  return (
    <>
      <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden">
        <Image
          src={collection.heroImage.src}
          alt={collection.heroImage.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="container-luxe relative z-10 max-w-2xl text-center text-ivory">
          {collection.tagline && (
            <span className="eyebrow text-champagne-soft">{collection.tagline}</span>
          )}
          <h1 className="mt-4 font-display text-5xl font-light md:text-6xl">
            {collection.name}
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-light leading-relaxed text-ivory/80">
            {collection.description}
          </p>
        </div>
      </section>

      <section className="container-luxe py-20">
        <ProductGrid products={products} />
      </section>
    </>
  );
}
