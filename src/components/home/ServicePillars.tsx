import { ShieldCheck, Gem, Leaf, Truck } from 'lucide-react';
import { servicePillars } from '@/config/site';

const ICONS = { shield: ShieldCheck, gem: Gem, leaf: Leaf, truck: Truck } as const;

export function ServicePillars() {
  return (
    <section className="border-b border-ink/10 bg-ivory-warm">
      <div className="container-luxe grid grid-cols-2 gap-x-6 gap-y-8 py-10 lg:grid-cols-4">
        {servicePillars.map((p) => {
          const Icon = ICONS[p.icon as keyof typeof ICONS];
          return (
            <div key={p.title} className="flex flex-col items-center gap-2.5 text-center">
              <Icon className="h-6 w-6 text-champagne-deep" strokeWidth={1.1} />
              <h3 className="font-display text-lg leading-tight text-ink">{p.title}</h3>
              <p className="max-w-[15rem] text-[12px] font-light leading-relaxed text-ink/55">{p.copy}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
