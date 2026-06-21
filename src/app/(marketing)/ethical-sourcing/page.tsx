import type { Metadata } from 'next';
import { Gem, Map, ShieldCheck, Sprout } from 'lucide-react';
import { SectionHeading } from '@/components/shared/SectionHeading';

export const metadata: Metadata = {
  title: 'Ethical Sourcing',
  description:
    'Our commitment to conflict-free, fully traceable diamonds — from mine to masterpiece.',
};

const pillars = [
  {
    icon: Map,
    title: 'Mine to Masterpiece',
    text: 'We trace every diamond from its origin, working only with mines and partners who meet the highest ethical standards.',
  },
  {
    icon: ShieldCheck,
    title: 'Conflict-Free Guarantee',
    text: 'Every stone complies fully with the Kimberley Process and our own, more stringent, sourcing protocols.',
  },
  {
    icon: Gem,
    title: 'Independent Certification',
    text: 'Each centre diamond is graded by an independent laboratory — GIA, IGI or HRD — and the report is yours to verify.',
  },
  {
    icon: Sprout,
    title: 'Responsible Choices',
    text: 'For those who prefer, we offer beautiful laboratory-grown diamonds of identical optical and chemical properties.',
  },
];

export default function EthicalSourcingPage() {
  return (
    <div className="container-luxe py-16">
      <SectionHeading
        as="h1"
        eyebrow="Our Commitment"
        title="Beauty with a Clear Conscience"
        description="A diamond should bring only joy. We hold ourselves to the highest standards of provenance, transparency and care."
        className="mb-16"
      />

      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        {pillars.map((p) => (
          <div key={p.title} className="flex gap-5 border border-ink/10 p-8">
            <p.icon className="h-7 w-7 shrink-0 text-champagne-deep" strokeWidth={1.25} />
            <div>
              <h2 className="font-display text-2xl text-ink">{p.title}</h2>
              <p className="mt-2 text-sm font-light leading-relaxed text-ink/70">
                {p.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
