import Link from 'next/link';
import { getProductBySlug } from '@/lib/data';
import { JewelArt } from '@/components/art/JewelArt';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Divider } from '@/components/ui/Divider';
import { Reveal } from '@/components/ui/Reveal';
import type { JewelArt as Art } from '@/types';

const TILES = [
  { eyebrow: 'Brilliance, Worn', title: 'Earrings', href: '/earrings', slug: 'cascade-drop-earrings' },
  { eyebrow: 'The Décolletage', title: 'Necklaces', href: '/necklaces', slug: 'sovereign-riviere-necklace' },
  { eyebrow: 'Forever, in Line', title: 'Bracelets', href: '/bracelets', slug: 'eternelle-tennis-bracelet' },
  { eyebrow: 'Like No Other', title: 'Bespoke', href: '/bespoke', slug: 'empress-emerald-ring' },
];

export function SectionShowcase() {
  const engagement = getProductBySlug('aurora-solitaire-ring');

  return (
    <section className="ground-ivory py-20 md:py-28">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Explore the Maison"
          title="Five ways to wear forever"
          description="From the promise of an engagement ring to a bespoke commission of your own design — each created around a diamond of exceptional beauty."
          className="mb-6"
        />
        <Divider className="mb-14" />

        {/* Engagement banner */}
        {engagement && (
          <Reveal>
            <Link href="/engagement-rings" className="group relative mb-8 block h-[58vh] min-h-[420px] w-full overflow-hidden">
              <JewelArt art={engagement.art} gid="showcase-eng" tone="noir" className="h-full w-full transition-transform duration-[1.2s] ease-luxe group-hover:scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/70 via-noir/10 to-noir/30" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-ivory">
                <span className="eyebrow-light">The Promise</span>
                <h3 className="mt-3 font-display text-5xl font-light md:text-7xl">Engagement Rings</h3>
                <p className="mt-3 max-w-md px-6 font-light text-ivory/75">
                  Signature settings, or a ring designed entirely around your diamond.
                </p>
                <span className="mt-6 text-[11px] uppercase tracking-luxe text-ivory underline-offset-4 group-hover:underline">
                  Discover the Collection →
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        {/* Four tiles */}
        <div className="grid grid-cols-2 gap-5 md:gap-6 lg:grid-cols-4">
          {TILES.map((t, i) => {
            const p = getProductBySlug(t.slug);
            const art = p?.art as Art;
            return (
              <Reveal key={t.title} delay={(i % 4) * 0.08}>
                <Link href={t.href} className="group relative block aspect-[3/4] overflow-hidden">
                  <JewelArt art={art} gid={`showcase-${t.title}`} tone={t.title === 'Bespoke' ? 'noir' : 'ivory'} className="h-full w-full transition-transform duration-[1.2s] ease-luxe group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir/55 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-5 text-center text-ivory">
                    <span className="text-[9px] uppercase tracking-wide2 text-ivory/70">{t.eyebrow}</span>
                    <h3 className="mt-1.5 font-display text-2xl font-light md:text-3xl">{t.title}</h3>
                    <span className="mt-2 text-[10px] uppercase tracking-luxe text-ivory/0 transition-colors duration-500 group-hover:text-ivory/90">
                      Discover →
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
