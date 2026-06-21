import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { Diamond } from '@/components/art/Diamond';

const cs = [
  { c: 'Cut', copy: 'The most important C — how light returns to the eye as fire and brilliance.', shape: 'round' as const },
  { c: 'Colour', copy: 'From icy colourless D to faint warmth — the rarer, the more precious.', shape: 'emerald' as const },
  { c: 'Clarity', copy: 'The fewer inclusions, the rarer the stone and the cleaner its light.', shape: 'asscher' as const },
  { c: 'Carat', copy: 'A measure of weight, not size — balanced against the other three Cs.', shape: 'oval' as const },
];

export function DiamondGuideTeaser() {
  return (
    <section className="border-y border-ink/10 bg-ivory-warm py-20 md:py-28">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="The Diamond Guide"
          title="Know the Four Cs"
          description="Understanding cut, colour, clarity and carat is the key to choosing a diamond of true and lasting beauty. Let us be your guide."
          className="mb-14"
        />
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {cs.map((item, i) => (
            <Reveal key={item.c} delay={(i % 4) * 0.08}>
              <Link href="/diamond-guide" className="group flex flex-col items-center text-center">
                <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-ivory transition-transform duration-500 group-hover:scale-105">
                  <Diamond shape={item.shape} size={66} id={`4c-${item.c}`} />
                </div>
                <h3 className="font-display text-2xl text-ink">{item.c}</h3>
                <p className="mt-2 max-w-[15rem] text-[13px] font-light leading-relaxed text-ink/60">{item.copy}</p>
              </Link>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/diamond-guide" className="text-[11px] uppercase tracking-luxe text-champagne-deep link-underline">
            Read the Complete Guide →
          </Link>
        </div>
      </div>
    </section>
  );
}
