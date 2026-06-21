import Link from 'next/link';
import { Gem, Sparkles } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';

export default function BuilderStartPage() {
  return (
    <div className="container-luxe py-20">
      <SectionHeading
        as="h1"
        eyebrow="Create Your Own"
        title="Begin Your Creation"
        description="In three considered steps, design an engagement ring as singular as the moment it marks. Begin with the setting, or with the diamond — the choice is yours."
        className="mb-16"
      />

      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/engagement-rings/builder/setting"
          className="group flex flex-col items-center gap-5 border border-ink/15 p-12 text-center transition hover:border-ink"
        >
          <Sparkles className="h-9 w-9 text-champagne-deep" strokeWidth={1} />
          <h3 className="font-display text-2xl text-ink">Start with a Setting</h3>
          <p className="text-sm font-light leading-relaxed text-ink/65">
            Choose from our hand-finished solitaire, halo and trilogy designs, then find the
            diamond to complete it.
          </p>
          <span className="text-xs uppercase tracking-luxe text-ink group-hover:text-champagne-deep">
            Choose Setting →
          </span>
        </Link>

        <Link
          href="/engagement-rings/builder/diamond"
          className="group flex flex-col items-center gap-5 border border-ink/15 p-12 text-center transition hover:border-ink"
        >
          <Gem className="h-9 w-9 text-champagne-deep" strokeWidth={1} />
          <h3 className="font-display text-2xl text-ink">Start with a Diamond</h3>
          <p className="text-sm font-light leading-relaxed text-ink/65">
            Browse our collection of certified diamonds by shape and the 4Cs, then choose a
            setting to cradle it.
          </p>
          <span className="text-xs uppercase tracking-luxe text-ink group-hover:text-champagne-deep">
            Choose Diamond →
          </span>
        </Link>
      </div>
    </div>
  );
}
