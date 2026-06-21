import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Reveal } from '@/components/shared/Reveal';
import { getCollections } from '@/lib/data/collections';
import { SHIMMER_BLUR } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Explore the collections of Éclat Grandeur.',
};

export default function CollectionsPage() {
  const collections = getCollections();

  return (
    <div className="container-luxe py-16">
      <SectionHeading
        as="h1"
        eyebrow="The Maison"
        title="Our Collections"
        description="Each a singular vision, united by the pursuit of the extraordinary."
        className="mb-16"
      />
      <div className="flex flex-col gap-6">
        {collections.map((c, i) => (
          <Reveal key={c.id} delay={(i % 2) * 0.1}>
            <Link
              href={`/collections/${c.slug}`}
              className="group relative block aspect-[21/9] overflow-hidden"
            >
              <Image
                src={c.heroImage.src}
                alt={c.heroImage.alt}
                fill
                sizes="100vw"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR}
                className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-ink/30 transition group-hover:bg-ink/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-ivory">
                {c.tagline && (
                  <span className="eyebrow text-champagne-soft">{c.tagline}</span>
                )}
                <h2 className="mt-3 font-display text-5xl">{c.name}</h2>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
