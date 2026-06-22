import Link from 'next/link';
import { Settings2, Diamond as DiamondIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

const STEPS = [
  {
    icon: Settings2,
    n: '1',
    title: 'Choose a Setting',
    copy: 'Pick from solitaire, halo, three-stone and pavé styles in four metals.',
  },
  {
    icon: DiamondIcon,
    n: '2',
    title: 'Choose a Diamond',
    copy: 'Search thousands of certified loose diamonds by cut, color, clarity and carat.',
  },
  {
    icon: Sparkles,
    n: '3',
    title: 'Complete Your Ring',
    copy: 'See your ring and price update live, then add it to your bag.',
  },
];

export function BuildYourRingBand() {
  return (
    <section className="bg-ivory-warm py-16 md:py-20">
      <div className="container-luxe">
        <Reveal className="mb-12 text-center">
          <span className="eyebrow">Build Your Own Ring</span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-noir md:text-4xl">
            Design a ring as unique as your story
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink/60">
            Our most-loved experience, in three simple steps.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <Reveal key={s.n}>
              <div className="flex h-full flex-col items-center rounded-lg border border-ink/10 bg-white p-8 text-center">
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-glacier-soft text-champagne-deep">
                  <s.icon className="h-7 w-7" strokeWidth={1.5} />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-champagne text-[12px] font-bold text-white">
                    {s.n}
                  </span>
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-noir">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{s.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex justify-center gap-3">
          <Button href="/build-a-ring?start=setting" variant="primary" size="lg">
            Start with a Setting
          </Button>
          <Button href="/build-a-ring?start=diamond" variant="outline" size="lg">
            Start with a Diamond
          </Button>
        </div>
      </div>
    </section>
  );
}
