import Link from 'next/link';
import Image from 'next/image';
import type { Collection } from '@/types/collection';
import { SHIMMER_BLUR } from '@/lib/utils';
import { Reveal } from '@/components/shared/Reveal';

export function FeaturedCollections({
  collections,
}: {
  collections: Collection[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {collections.map((collection, i) => (
        <Reveal key={collection.id} delay={i * 0.1}>
          <Link
            href={`/collections/${collection.slug}`}
            className="group relative block aspect-[16/10] overflow-hidden"
          >
            <Image
              src={collection.heroImage.src}
              alt={collection.heroImage.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR}
              className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-ink/30 transition-colors group-hover:bg-ink/40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-ivory">
              {collection.tagline && (
                <span className="eyebrow text-champagne-soft">
                  {collection.tagline}
                </span>
              )}
              <h3 className="mt-3 font-display text-4xl">{collection.name}</h3>
              <span className="mt-4 text-xs uppercase tracking-luxe underline-offset-4 group-hover:underline">
                Discover
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
