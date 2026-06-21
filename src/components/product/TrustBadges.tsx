import { Award, Gem, RefreshCw, ShieldCheck } from 'lucide-react';

const badges = [
  { icon: Award, label: 'GIA Certified', detail: 'Independently graded diamonds' },
  { icon: Gem, label: 'Ethically Sourced', detail: 'Conflict-free & traceable' },
  { icon: RefreshCw, label: '30-Day Returns', detail: 'Complimentary & insured' },
  { icon: ShieldCheck, label: 'Lifetime Care', detail: 'Cleaning & inspection' },
];

export function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-6 border-y border-ink/10 py-8 md:grid-cols-4">
      {badges.map((b) => (
        <div key={b.label} className="flex flex-col items-center gap-2 text-center">
          <b.icon className="h-6 w-6 text-champagne-deep" strokeWidth={1.25} />
          <span className="text-xs uppercase tracking-luxe text-ink">{b.label}</span>
          <span className="text-xs font-light text-ink/55">{b.detail}</span>
        </div>
      ))}
    </div>
  );
}
