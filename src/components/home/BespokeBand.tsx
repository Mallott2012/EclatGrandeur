import { getProductBySlug } from '@/lib/data';
import { JewelArt } from '@/components/art/JewelArt';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

const steps = [
  { n: '01', title: 'Choose a setting', copy: 'Begin with a hand-finished design, from solitaire to halo to pavé.' },
  { n: '02', title: 'Select your diamond', copy: 'Filter GIA-certified stones by cut, colour, clarity and carat.' },
  { n: '03', title: 'See it come to life', copy: 'Preview your ring in our interactive viewer, with live pricing.' },
];

export function BespokeBand() {
  const ring = getProductBySlug('celeste-pave-ring');
  return (
    <section className="ground-noir text-ivory">
      <div className="container-luxe grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <Reveal>
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden">
            {ring && <JewelArt art={ring.art} gid="bespoke-band" tone="noir" className="h-full w-full" />}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-col">
            <span className="eyebrow-light">Create Your Own</span>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">
              A ring like no other, in three steps
            </h2>
            <p className="mt-5 max-w-md font-light leading-relaxed text-ivory/65">
              Our atelier puts the design in your hands. Pair a setting with a diamond of your
              choosing and watch your ring take shape, with the price updating as you go.
            </p>

            <ol className="mt-9 flex flex-col gap-6">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="font-display text-2xl text-champagne">{s.n}</span>
                  <div>
                    <h3 className="font-display text-xl">{s.title}</h3>
                    <p className="mt-1 text-sm font-light text-ivory/60">{s.copy}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button href="/builder" variant="gold" size="lg">Start Designing</Button>
              <Button href="/bespoke" variant="light" size="lg">The Bespoke Atelier</Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
