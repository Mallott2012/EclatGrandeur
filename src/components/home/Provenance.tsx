import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { SparkleField } from '@/components/art/Sparkle';
import { ShieldCheck, Leaf, MapPin } from 'lucide-react';

const points = [
  { icon: MapPin, title: 'Traceable origin', copy: 'Every diamond mapped from mine to setting.' },
  { icon: Leaf, title: 'Responsibly sourced', copy: 'Partners held to the strictest environmental standards.' },
  { icon: ShieldCheck, title: 'Conflict-free, always', copy: 'Beyond the Kimberley Process, without exception.' },
];

export function Provenance() {
  return (
    <section className="relative overflow-hidden ground-noir py-20 text-ivory md:py-28">
      <SparkleField color="text-champagne/30" />
      <div className="container-luxe relative z-10 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div>
            <span className="eyebrow-light">Provenance</span>
            <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">
              Beauty with a clear conscience
            </h2>
            <p className="mt-5 max-w-md font-light leading-relaxed text-ivory/65">
              A diamond should carry only joy. We trace every stone to a responsible source,
              so the only thing it holds is meaning.
            </p>
            <div className="mt-9">
              <Button href="/maison#provenance" variant="light" size="lg">Our Commitment</Button>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ul className="flex flex-col gap-7">
            {points.map((p) => (
              <li key={p.title} className="flex items-start gap-5 border-b border-ivory/10 pb-7 last:border-0">
                <p.icon className="mt-0.5 h-6 w-6 shrink-0 text-champagne" strokeWidth={1.1} />
                <div>
                  <h3 className="font-display text-2xl">{p.title}</h3>
                  <p className="mt-1 font-light text-ivory/60">{p.copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
