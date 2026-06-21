import type { Metadata } from 'next';
import { getProductsBySlugs } from '@/lib/data';
import { JewelArt } from '@/components/art/JewelArt';
import { Diamond } from '@/components/art/Diamond';
import { SparkleField } from '@/components/art/Sparkle';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Divider } from '@/components/ui/Divider';

export const metadata: Metadata = {
  title: 'Bespoke',
  description:
    'The Éclat Grandeur bespoke atelier. From a single sketch to a finished heirloom — design a one-of-a-kind diamond creation with our master jewellers.',
};

const journey = [
  { n: '01', title: 'The Consultation', copy: 'We begin with a conversation — in our Mayfair atelier, by video or by phone — to understand the moment, the wearer and the dream.' },
  { n: '02', title: 'Sourcing the Stone', copy: 'Our diamantaires search global vaults for a stone that meets your brief, presenting only those worthy of the commission.' },
  { n: '03', title: 'The Design', copy: 'Hand sketches become precise renders. You see your piece from every angle, refining until it is exactly right.' },
  { n: '04', title: 'The Making', copy: 'Master goldsmiths bring the design to life by hand over several weeks, setting each diamond under the loupe.' },
  { n: '05', title: 'The Reveal', copy: 'Your finished creation is presented in our atelier, complete with its certification and a story that is yours alone.' },
];

export default function BespokePage() {
  const gallery = getProductsBySlugs([
    'empress-emerald-ring',
    'monarch-emerald-necklace',
    'comete-drop-earrings',
    'sovereign-riviere-necklace',
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden ground-noir text-ivory">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[2px]">
          <Diamond shape="emerald" size={520} id="bespoke-hero-bg" className="animate-float" />
        </div>
        <SparkleField color="text-champagne/50" />
        <div className="container-luxe relative z-10 flex flex-col items-center text-center">
          <span className="eyebrow-light">The Bespoke Atelier</span>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-light leading-[1.05] md:text-7xl">
            Imagined by you,<br /><span className="text-gold-foil">realised by our hands</span>
          </h1>
          <p className="mt-6 max-w-xl font-light leading-relaxed text-ivory/70">
            The rarest thing we make is the piece that exists only for you. Our atelier turns a
            feeling into a diamond creation that will be worn for generations.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/appointments" variant="gold" size="lg">Book a Consultation</Button>
            <Button href="/build-a-ring" variant="light" size="lg">Design a Ring Online</Button>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="ground-ivory py-20 md:py-28">
        <div className="container-luxe max-w-3xl text-center">
          <SectionHeading
            eyebrow="No Two Alike"
            title="A commission is a conversation"
            description="Whether you arrive with a precise vision or only a feeling, our designers and diamantaires guide every decision — from the cut of the stone to the curve of a claw."
          />
          <Divider className="mx-auto mt-10 max-w-xs" />
        </div>
      </section>

      {/* Journey */}
      <section className="border-y border-ink/10 bg-ivory-warm py-20 md:py-28">
        <div className="container-luxe">
          <SectionHeading eyebrow="The Journey" title="From sketch to heirloom" className="mb-16" />
          <ol className="mx-auto flex max-w-3xl flex-col">
            {journey.map((s, i) => (
              <Reveal key={s.n} delay={(i % 5) * 0.05}>
                <li className="flex gap-7 border-b border-ink/10 py-8 last:border-0">
                  <span className="font-display text-4xl text-champagne">{s.n}</span>
                  <div>
                    <h3 className="font-display text-2xl text-ink">{s.title}</h3>
                    <p className="mt-2 max-w-xl font-light leading-relaxed text-ink/65">{s.copy}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Gallery */}
      <section className="container-luxe py-20 md:py-28">
        <SectionHeading
          eyebrow="Recent Commissions"
          title="A few pieces that began as an idea"
          description="Every bespoke creation is unique. These are a handful that have left our atelier."
          className="mb-14"
        />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
          {gallery.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 0.08}>
              <div className="group flex flex-col">
                <div className="aspect-[4/5] overflow-hidden bg-ivory-deep">
                  <JewelArt art={p.art} gid={`bespoke-gal-${p.id}`} tone="noir" className="h-full w-full transition-transform duration-700 ease-luxe group-hover:scale-105" />
                </div>
                <h3 className="mt-4 font-display text-xl text-ink">{p.name}</h3>
                <p className="text-sm font-light text-ink/55">A private commission</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="ground-noir py-20 text-center text-ivory md:py-28">
        <div className="container-luxe flex flex-col items-center">
          <span className="eyebrow-light">Begin Your Commission</span>
          <h2 className="mt-4 max-w-2xl font-display text-4xl font-light md:text-5xl">
            Let us make the one that doesn’t exist yet
          </h2>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Button href="/appointments" variant="gold" size="lg">Book a Consultation</Button>
            <Button href="/contact" variant="light" size="lg">Speak to the Atelier</Button>
          </div>
        </div>
      </section>
    </>
  );
}
