import type { Metadata } from 'next';
import { Diamond } from '@/components/art/Diamond';
import { SparkleField } from '@/components/art/Sparkle';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Divider } from '@/components/ui/Divider';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { siteConfig } from '@/config/site';
import { ShieldCheck, Leaf, MapPin, Hammer } from 'lucide-react';

export const metadata: Metadata = {
  title: 'The Maison',
  description:
    'The story of Éclat Grandeur — a Mayfair maison crafting fine diamond jewellery since 1924, with an uncompromising commitment to beauty and ethical provenance.',
};

const numbers = [
  { n: '1924', label: 'Founded in Mayfair' },
  { n: '100%', label: 'Traceable diamonds' },
  { n: '5,000+', label: 'Commissions realised' },
  { n: 'Lifetime', label: 'Guarantee on every piece' },
];

const craft = [
  { icon: Hammer, title: 'Hand-made', copy: 'Every piece is built by hand at the bench, not cast in volume.' },
  { icon: ShieldCheck, title: 'Guaranteed for life', copy: 'Complimentary care, cleaning and re-finishing, forever.' },
  { icon: MapPin, title: 'Mayfair atelier', copy: 'Designed and finished in the heart of London.' },
  { icon: Leaf, title: 'Responsible by design', copy: 'Sustainability written into every supplier relationship.' },
];

export default function MaisonPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[64vh] items-center justify-center overflow-hidden ground-noir text-ivory">
        <SparkleField color="text-champagne/40" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 blur-[2px]">
          <Diamond shape="marquise" size={460} id="maison-hero" className="animate-float" />
        </div>
        <div className="container-luxe relative z-10 text-center">
          <span className="eyebrow-light">Est. {siteConfig.founded} · London</span>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-light leading-[1.05] md:text-7xl">
            A century in pursuit of light
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="container-luxe py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Our Story"
            title="The maison"
            description="Éclat Grandeur was founded on a single conviction: that a diamond is not a commodity but a moment made permanent. Four generations later, that belief still guides every stone we choose and every ring we make."
          />
          <Divider className="mx-auto mt-10 max-w-xs" />
          <p className="mt-10 text-lg font-light leading-relaxed text-ink/70">
            From a single bench in Mayfair, we have grown into a maison trusted with life’s most
            important pieces — and never once outsourced the thing that matters: the craft. We
            still design, set and finish by hand, under the loupe, exactly as we did in 1924.
          </p>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-y border-ink/10 bg-ivory-warm py-16">
        <div className="container-luxe grid grid-cols-2 gap-8 lg:grid-cols-4">
          {numbers.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-4xl text-ink md:text-5xl">{s.n}</p>
              <p className="mt-2 text-[11px] uppercase tracking-luxe text-ink/50">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="container-luxe py-20 md:py-28">
        <SectionHeading eyebrow="The Craft" title="Made by hand, made to last" className="mb-14" />
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {craft.map((c, i) => (
            <Reveal key={c.title} delay={(i % 4) * 0.08}>
              <div className="flex flex-col items-center gap-3 border border-ink/10 p-8 text-center">
                <c.icon className="h-7 w-7 text-champagne-deep" strokeWidth={1.1} />
                <h3 className="font-display text-xl text-ink">{c.title}</h3>
                <p className="text-[13px] font-light leading-relaxed text-ink/60">{c.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Provenance */}
      <section id="provenance" className="relative scroll-mt-40 overflow-hidden ground-noir py-20 text-ivory md:py-28">
        <SparkleField color="text-champagne/30" />
        <div className="container-luxe relative z-10 mx-auto max-w-3xl text-center">
          <span className="eyebrow-light">Provenance</span>
          <h2 className="mt-4 font-display text-4xl font-light md:text-5xl">Beauty with a clear conscience</h2>
          <p className="mt-6 font-light leading-relaxed text-ivory/70">
            We trace every diamond from its source, working only with partners who meet the
            strictest environmental and humanitarian standards — far beyond the Kimberley Process.
            A stone should carry only joy. We make certain of it.
          </p>
          <div className="mt-9">
            <Button href="/appointments" variant="gold" size="lg">Visit the Atelier</Button>
          </div>
        </div>
      </section>
    </>
  );
}
