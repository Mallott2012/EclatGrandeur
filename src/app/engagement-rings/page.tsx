import type { Metadata } from 'next';
import Image from 'next/image';
import { ProductGrid } from '@/components/product/ProductGrid';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/shared/Reveal';
import { getProductsByCategory } from '@/lib/data/products';
import { placeholder, SHIMMER_BLUR } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Engagement Rings',
  description:
    'Diamond engagement rings, hand-finished in our London atelier — or create your own around the diamond of a lifetime.',
};

export default function EngagementRingsPage() {
  const rings = getProductsByCategory('engagement-rings');

  return (
    <>
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden">
        <Image
          src={placeholder(2000, 1100, 'Engagement+Rings')}
          alt="Engagement rings"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="container-luxe relative z-10 text-center text-ivory">
          <span className="eyebrow text-champagne-soft">Engagement</span>
          <h1 className="mt-5 font-display text-5xl font-light md:text-6xl">
            A Promise, Perfectly Made
          </h1>
          <p className="mx-auto mt-5 max-w-xl font-light text-ivory/80">
            Choose a signature design, or create your own around a diamond of exceptional
            beauty.
          </p>
          <div className="mt-9">
            <Button href="/engagement-rings/builder" variant="gold" size="lg">
              Create Your Own
            </Button>
          </div>
        </div>
      </section>

      {/* Builder banner */}
      <section className="container-luxe py-20">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-10 border border-ink/10 p-10 md:grid-cols-3 md:p-14">
            <div className="md:col-span-2">
              <span className="eyebrow">Create Your Own</span>
              <h2 className="mt-3 font-display text-3xl font-light text-ink md:text-4xl">
                Three steps to a ring like no other
              </h2>
              <p className="mt-4 max-w-xl font-light leading-relaxed text-ink/65">
                Select a setting, choose your diamond by the 4Cs, and watch your ring come to
                life in three dimensions — with the price updating as you design.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Button href="/engagement-rings/builder" size="lg">
                Begin
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="container-luxe pb-24">
        <SectionHeading
          eyebrow="Signature Designs"
          title="The Engagement Collection"
          className="mb-12"
        />
        <ProductGrid products={rings} />
      </section>
    </>
  );
}
