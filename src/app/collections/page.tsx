import type { Metadata } from 'next';
import Link from 'next/link';
import { getCollections } from '@/lib/data';
import { JewelArt } from '@/components/art/JewelArt';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Explore the signature collections of Éclat Grandeur — Aurora, Monarch, Éternelle and Céleste.',
};

export default function CollectionsPage() {
  const collections = getCollections();
  return (
    <div className="container-luxe py-16 md:py-24">
      <SectionHeading
        eyebrow="The Collections"
        title="Four worlds of light"
        description="Each collection is a distinct expression of our craft — a different way of setting the world's most beautiful diamonds."
        className="mb-16"
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {collections.map((c, i) => (
          <Reveal key={c.id} delay={(i % 2) * 0.1}>
            <Link href={`/collections/${c.slug}`} className="group relative block aspect-[16/10] overflow-hidden">
              <JewelArt art={c.art} gid={`col-${c.slug}`} tone="noir" className="h-full w-full transition-transform duration-700 ease-luxe group-hover:scale-105" />
              <div className="absolute inset-0 bg-noir/30 transition-colors group-hover:bg-noir/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-ivory">
                <span className="eyebrow-light">{c.tagline}</span>
                <h3 className="mt-3 font-display text-4xl font-light md:text-5xl">{c.name}</h3>
                <span className="mt-4 text-[11px] uppercase tracking-luxe underline-offset-4 group-hover:underline">Discover →</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
