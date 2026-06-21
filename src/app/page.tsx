import Link from 'next/link';
import Image from 'next/image';
import { Hero } from '@/components/home/Hero';
import { FeaturedCollections } from '@/components/home/FeaturedCollections';
import { ProductGrid } from '@/components/product/ProductGrid';
import { TrustBadges } from '@/components/product/TrustBadges';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { getFeaturedCollections } from '@/lib/data/collections';
import { getFeaturedProducts } from '@/lib/data/products';
import { getArticles } from '@/lib/data/education';
import { placeholder, SHIMMER_BLUR } from '@/lib/utils';

export default function HomePage() {
  const collections = getFeaturedCollections();
  const featured = getFeaturedProducts().slice(0, 4);
  const articles = getArticles().slice(0, 3);

  return (
    <>
      <Hero />

      <section className="container-luxe py-12">
        <TrustBadges />
      </section>

      {/* Ring builder CTA */}
      <section className="relative overflow-hidden bg-ink text-ivory">
        <div className="container-luxe grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2">
          <Reveal>
            <div className="flex flex-col gap-6">
              <span className="eyebrow text-champagne-soft">Create Your Own</span>
              <h2 className="font-display text-4xl font-light leading-tight md:text-5xl">
                Design the ring around the diamond of a lifetime
              </h2>
              <p className="max-w-lg font-light leading-relaxed text-ivory/75">
                Choose a hand-finished setting, then select your diamond by shape and the
                4Cs. See your creation rendered in three dimensions, with the price updating
                as you go.
              </p>
              <div>
                <Button href="/engagement-rings/builder" variant="gold" size="lg">
                  Begin Your Creation
                </Button>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="relative aspect-square w-full overflow-hidden">
              <Image
                src={placeholder(1000, 1000, 'Create+Your+Own')}
                alt="Create your own ring"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR}
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Featured collections */}
      <section className="container-luxe py-24">
        <SectionHeading
          eyebrow="Collections"
          title="Worlds of Wonder"
          description="Each collection is a singular vision, united by the pursuit of the extraordinary."
          className="mb-14"
        />
        <FeaturedCollections collections={collections} />
      </section>

      {/* Featured products */}
      <section className="bg-ivory-deep/40 py-24">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Signature Pieces"
            title="The Maison’s Favourites"
            className="mb-14"
          />
          <ProductGrid products={featured} />
          <div className="mt-14 text-center">
            <Button href="/jewellery/necklaces" variant="outline">
              Explore All Jewellery
            </Button>
          </div>
        </div>
      </section>

      {/* Education teaser */}
      <section className="container-luxe py-24">
        <SectionHeading
          eyebrow="The Diamond Guide"
          title="Buy with Knowledge"
          description="Understanding a diamond is the first step to treasuring it. Begin with our expert guides."
          className="mb-14"
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {articles.map((article, i) => (
            <Reveal key={article.slug} delay={i * 0.1}>
              <Link href={`/education/${article.slug}`} className="group block">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={article.heroImage.src}
                    alt={article.heroImage.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    placeholder="blur"
                    blurDataURL={SHIMMER_BLUR}
                    className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-5 font-display text-2xl text-ink">{article.title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-ink/65">
                  {article.excerpt}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
