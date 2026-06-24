import type { Metadata } from 'next';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/data';
import { JewelArt } from '@/components/art/JewelArt';
import { SectionHeading } from '@/components/ui/SectionHeading';

export const metadata: Metadata = {
  title: 'Fine Jewelry',
  description:
    'Shop fine jewelry — diamond earrings, necklaces and pendants, bracelets and high jewelry, all crafted around certified diamonds.',
};

const TILES = [
  { title: 'Earrings', href: '/earrings', slug: 'cascade-drop-earrings', copy: 'Studs, drops and hoops.' },
  { title: 'Necklaces', href: '/necklaces', slug: 'sovereign-riviere-necklace', copy: 'Pendants and rivières.' },
  { title: 'Bracelets', href: '/bracelets', slug: 'eternelle-tennis-bracelet', copy: 'Tennis bracelets and bangles.' },
  { title: 'High Jewelry', href: '/high-jewellery', slug: 'empress-emerald-ring', copy: 'One-of-a-kind statement pieces.' },
];

export default function JewelryPage() {
  return (
    <div className="bg-ivory">
      <div className="container-luxe py-12 md:py-16">
        <SectionHeading
          eyebrow="Fine Jewelry"
          title="Brilliance for every moment"
          description="Diamond jewelry crafted around independently certified stones, with free shipping and free returns."
          className="mb-12"
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TILES.map((t) => {
            const product = getProductBySlug(t.slug);
            return (
              <Link
                key={t.title}
                href={t.href}
                className="group flex flex-col rounded-lg border border-ink/10 bg-white p-4 transition hover:border-champagne hover:shadow-card"
              >
                <div className="aspect-square overflow-hidden rounded bg-ivory-warm">
                  {product && (
                    <JewelArt
                      art={product.art}
                      gid={`jewelry-${t.slug}`}
                      className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-noir">{t.title}</h3>
                <p className="mt-1 text-sm text-ink/60">{t.copy}</p>
                <span className="mt-3 text-[12px] font-semibold uppercase tracking-luxe text-champagne-deep">
                  Shop {t.title} →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
