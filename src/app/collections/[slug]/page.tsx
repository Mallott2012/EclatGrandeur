import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCollections, getCollectionBySlug, getProductsBySlugs } from '@/lib/data';
import { JewelArt } from '@/components/art/JewelArt';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SparkleField } from '@/components/art/Sparkle';
import { Divider } from '@/components/ui/Divider';

export function generateStaticParams() {
  return getCollections().map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = getCollectionBySlug(params.slug);
  if (!c) return { title: 'Not found' };
  return { title: `${c.name} Collection`, description: c.description };
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = getCollectionBySlug(params.slug);
  if (!collection) notFound();
  const products = getProductsBySlugs(collection.productSlugs);

  return (
    <>
      <section className="relative h-[54vh] min-h-[400px] w-full overflow-hidden">
        <JewelArt art={collection.art} gid={`colhero-${collection.slug}`} tone="noir" className="h-full w-full" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-noir/25 to-noir/40" />
        <SparkleField color="text-champagne/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-ivory">
          <span className="eyebrow-light">{collection.tagline}</span>
          <h1 className="mt-4 font-display text-5xl font-light md:text-7xl">{collection.name}</h1>
        </div>
      </section>

      <div className="container-luxe py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-light leading-relaxed text-ink/70">{collection.description}</p>
          <Divider className="mx-auto mt-10 max-w-xs" />
        </div>
        <div className="mt-14">
          <ProductGrid products={products} gidPrefix={`coll-${collection.slug}`} />
        </div>
      </div>
    </>
  );
}
