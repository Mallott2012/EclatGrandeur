import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';
import { placeholder } from '@/lib/utils';

export function Hero() {
  return (
    <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
      <Image
        src={placeholder(2000, 1200, 'Eclat+Grandeur')}
        alt="Éclat Grandeur high jewellery"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/20 to-ink/60" />
      <div className="container-luxe relative z-10 flex flex-col items-center text-center text-ivory">
        <span className="eyebrow text-champagne-soft">{siteConfig.name}</span>
        <h1 className="mt-6 max-w-4xl text-4xl font-light leading-tight md:text-7xl">
          {siteConfig.tagline}
        </h1>
        <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-ivory/80">
          Rare diamonds, master-crafted into jewellery destined to be treasured for
          generations.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button href="/engagement-rings" variant="gold" size="lg">
            Engagement Rings
          </Button>
          <Button
            href="/engagement-rings/builder"
            size="lg"
            className="border border-ivory/40 text-ivory hover:bg-ivory hover:text-ink"
            variant="ghost"
          >
            Create Your Own
          </Button>
        </div>
      </div>
    </section>
  );
}
