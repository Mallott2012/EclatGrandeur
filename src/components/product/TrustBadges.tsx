import { ShieldCheck, Gem, Leaf, Truck } from 'lucide-react';

const items = [
  { icon: Gem, label: 'GIA-certified diamond' },
  { icon: ShieldCheck, label: 'Lifetime guarantee' },
  { icon: Leaf, label: 'Ethically sourced' },
  { icon: Truck, label: 'Insured delivery' },
];

export function TrustBadges() {
  return (
    <ul className="grid grid-cols-2 gap-4 border-y border-ink/10 py-6">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-3">
          <it.icon className="h-5 w-5 shrink-0 text-champagne-deep" strokeWidth={1.25} />
          <span className="text-[12px] font-light text-ink/70">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
