import Link from 'next/link';
import type { Category } from '@/types';
import { getProductsByCategory, getProductBySlug } from '@/lib/data';
import { JewelArt } from '@/components/art/JewelArt';
import { CategoryView } from './CategoryView';
import { SparkleField } from '@/components/art/Sparkle';
import { Button } from '@/components/ui/Button';

interface Props {
  category: Category;
  eyebrow: string;
  title: string;
  description: string;
  bannerSlug: string;
  showBuilder?: boolean;
}

export function CategoryPage({ category, eyebrow, title, description, bannerSlug, showBuilder }: Props) {
  const products = getProductsByCategory(category);
  const banner = getProductBySlug(bannerSlug);

  return (
    <>
      {/* Hero banner */}
      <section className="relative h-[52vh] min-h-[380px] w-full overflow-hidden">
        {banner && <JewelArt art={banner.art} gid={`cathero-${category}`} tone="noir" className="h-full w-full" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-noir/75 via-noir/30 to-noir/40" />
        <SparkleField color="text-champagne/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-ivory">
          <span className="eyebrow-light">{eyebrow}</span>
          <h1 className="mt-4 font-display text-5xl font-light md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-xl font-light leading-relaxed text-ivory/75">{description}</p>
        </div>
      </section>

      {showBuilder && (
        <section className="border-b border-ink/10 bg-ivory-warm">
          <div className="container-luxe flex flex-col items-center justify-between gap-6 py-7 text-center md:flex-row md:text-left">
            <div>
              <span className="eyebrow">Create Your Own</span>
              <p className="mt-1 font-display text-2xl font-light text-ink">
                Design a ring around the diamond of a lifetime.
              </p>
            </div>
            <Button href="/build-a-ring" variant="primary" size="md">Start Designing</Button>
          </div>
        </section>
      )}

      <section className="container-luxe py-14 md:py-20">
        <CategoryView products={products} gidPrefix={category} />
      </section>

      {/* Cross-sell footer */}
      <section className="border-t border-ink/10 bg-ivory-warm py-16">
        <div className="container-luxe flex flex-col items-center text-center">
          <h2 className="font-display text-3xl font-light text-ink">Not sure where to begin?</h2>
          <p className="mt-3 max-w-md font-light text-ink/60">
            Our specialists will help you find — or create — exactly the right piece.
          </p>
          <div className="mt-7 flex flex-col gap-4 sm:flex-row">
            <Button href="/appointments" variant="gold" size="md">Book an Appointment</Button>
            <Link href="/diamond-guide" className="inline-flex items-center justify-center px-4 text-[11px] uppercase tracking-luxe text-champagne-deep link-underline">
              Read the Diamond Guide →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
