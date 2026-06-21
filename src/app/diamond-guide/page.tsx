import type { Metadata } from 'next';
import { Diamond, DiamondShapeSvg } from '@/components/art/Diamond';
import { SparkleField } from '@/components/art/Sparkle';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Divider } from '@/components/ui/Divider';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { DIAMOND_SHAPE_LABELS, type DiamondShape } from '@/types';

export const metadata: Metadata = {
  title: 'The Diamond Guide',
  description:
    'Understand the Four Cs — cut, colour, clarity and carat — diamond shapes and certification, and learn to choose a stone of true and lasting beauty.',
};

const fourCs = [
  {
    c: 'Cut',
    shape: 'round' as DiamondShape,
    lead: 'The maker of light',
    copy: 'Of the four, cut matters most. It is the only C decided by human hand — the precision of angles and proportions that sends light back to the eye as fire and brilliance. A poorly cut diamond of high colour can look lifeless; a superbly cut one sings.',
    scale: ['Ideal', 'Excellent', 'Very Good', 'Good'],
  },
  {
    c: 'Colour',
    shape: 'emerald' as DiamondShape,
    lead: 'The absence of colour',
    copy: 'The finest white diamonds are graded D — utterly colourless — descending towards Z as faint warmth appears. The difference between neighbouring grades is subtle to the eye but significant in rarity. We work principally in the D–H range.',
    scale: ['D', 'E', 'F', 'G', 'H', 'I'],
  },
  {
    c: 'Clarity',
    shape: 'asscher' as DiamondShape,
    lead: 'Nature’s fingerprint',
    copy: 'Almost every diamond carries inclusions — tiny marks formed deep in the earth. Clarity grades how few and how faint they are, from Flawless (FL) to Included. We select stones that are eye-clean: their character invisible without a loupe.',
    scale: ['FL', 'IF', 'VVS', 'VS', 'SI'],
  },
  {
    c: 'Carat',
    shape: 'oval' as DiamondShape,
    lead: 'A measure of weight',
    copy: 'Carat measures weight, not size — and it should be the last C you fix, balanced against the other three. A well-cut, well-graded stone of modest carat will always outshine a larger one chosen on size alone.',
    scale: ['0.5ct', '1ct', '1.5ct', '2ct', '3ct+'],
  },
];

const shapes: DiamondShape[] = [
  'round', 'oval', 'princess', 'emerald', 'cushion', 'pear', 'marquise', 'radiant', 'asscher', 'heart',
];

export default function DiamondGuidePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden ground-noir text-ivory">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[2px]">
          <Diamond shape="round" size={440} id="guide-hero-bg" className="animate-float" />
        </div>
        <SparkleField color="text-champagne/40" />
        <div className="container-luxe relative z-10 text-center">
          <span className="eyebrow-light">Knowledge</span>
          <h1 className="mt-4 font-display text-5xl font-light md:text-7xl">The Diamond Guide</h1>
          <p className="mx-auto mt-5 max-w-xl font-light leading-relaxed text-ivory/70">
            A great diamond is not the largest, but the most beautifully balanced. Here is how to
            recognise one.
          </p>
        </div>
      </section>

      {/* Four Cs */}
      <section className="container-luxe py-20 md:py-28">
        <SectionHeading eyebrow="The Foundation" title="The Four Cs" className="mb-16" />
        <div className="flex flex-col gap-16">
          {fourCs.map((item, i) => (
            <Reveal key={item.c}>
              <div className={`grid grid-cols-1 items-center gap-10 md:grid-cols-2 ${i % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}>
                <div className="flex justify-center">
                  <div className="flex h-52 w-52 items-center justify-center rounded-full bg-ivory-warm">
                    <Diamond shape={item.shape} size={140} id={`guide-${item.c}`} />
                  </div>
                </div>
                <div>
                  <span className="font-display text-6xl text-champagne/30">{item.c[0]}</span>
                  <h3 className="mt-1 font-display text-3xl text-ink">{item.c}</h3>
                  <p className="mt-1 text-[11px] uppercase tracking-luxe text-champagne-deep">{item.lead}</p>
                  <p className="mt-4 max-w-md font-light leading-relaxed text-ink/65">{item.copy}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.scale.map((s) => (
                      <span key={s} className="border border-ink/15 px-3 py-1.5 text-[11px] uppercase tracking-luxe text-ink/60">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Shapes */}
      <section className="border-y border-ink/10 bg-ivory-warm py-20 md:py-28">
        <div className="container-luxe">
          <SectionHeading eyebrow="Silhouettes" title="The diamond shapes" description="Each cut carries its own character — from the fiery round brilliant to the architectural emerald." className="mb-14" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-5">
            {shapes.map((sh) => (
              <div key={sh} className="group flex flex-col items-center gap-3 text-center">
                <div className="flex h-20 w-20 items-center justify-center text-glacier-deep transition-transform duration-500 group-hover:scale-110">
                  <DiamondShapeSvg shape={sh} size={56} />
                </div>
                <span className="text-[11px] uppercase tracking-luxe text-ink/70">{DIAMOND_SHAPE_LABELS[sh]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certification */}
      <section className="container-luxe py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="eyebrow">Trust</span>
              <h2 className="mt-4 font-display text-4xl font-light leading-tight">Independently certified, without exception</h2>
              <p className="mt-5 max-w-md font-light leading-relaxed text-ink/65">
                Every Éclat Grandeur diamond above 0.30ct arrives with a certificate from the GIA or
                IGI — the world’s most respected gemmological laboratories. The grading is theirs,
                not ours: an impartial record of exactly what you own.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button href="/builder" variant="gold" size="lg">Design Your Ring</Button>
                <Button href="/appointments" variant="outline" size="lg">Speak to a Specialist</Button>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-4">
              {['GIA', 'IGI', 'Conflict-free', 'Lifetime care'].map((t) => (
                <div key={t} className="flex aspect-[4/3] flex-col items-center justify-center gap-2 border border-ink/12 bg-ivory-warm text-center">
                  <Diamond shape="round" size={44} id={`cert-${t}`} sparkle={false} />
                  <span className="text-[11px] uppercase tracking-luxe text-ink/60">{t}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
