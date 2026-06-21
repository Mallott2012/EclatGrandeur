'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShieldCheck, Truck, Award } from 'lucide-react';
import { DiamondShapeSvg } from '@/components/art/Diamond';
import { Sparkle } from '@/components/art/Sparkle';
import { Button } from '@/components/ui/Button';
import { useBuilder } from '@/lib/store/builder';
import { useCart } from '@/lib/store/cart';
import { formatMoney } from '@/lib/utils';
import { DIAMOND_SHAPE_LABELS, type Diamond } from '@/types';

export function DiamondDetail({ diamond: d }: { diamond: Diamond }) {
  const router = useRouter();
  const setDiamond = useBuilder((s) => s.setDiamond);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const setInRing = () => {
    setDiamond(d.id);
    router.push('/build-a-ring?start=diamond&step=setting');
  };

  const addLoose = () => {
    add({
      id: `loose-${d.id}`,
      name: `${d.carat.toFixed(2)}ct ${DIAMOND_SHAPE_LABELS[d.shape]} Diamond`,
      href: `/diamonds/${d.id}`,
      price: d.price,
      meta: `${d.colour} · ${d.clarity} · ${d.cut} · ${d.authority}`,
      art: { kind: 'solitaire-ring', shape: d.shape, metal: 'platinum', caratVisual: 1 },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const specs: [string, string][] = [
    ['Shape', DIAMOND_SHAPE_LABELS[d.shape]],
    ['Carat', d.carat.toFixed(2)],
    ['Cut', d.cut],
    ['Color', d.colour],
    ['Clarity', d.clarity],
    ['Polish', d.polish ?? 'Excellent'],
    ['Symmetry', d.symmetry ?? 'Excellent'],
    ['Fluorescence', d.fluorescence ?? 'None'],
    ['Table', d.table ? `${d.table}%` : '—'],
    ['Depth', d.depth ? `${d.depth}%` : '—'],
    ['Report', `${d.authority} ${d.report.split(' ')[1] ?? ''}`],
    ['Certificate', d.authority],
  ];

  return (
    <div className="container-luxe grid grid-cols-1 gap-12 py-6 md:py-10 lg:grid-cols-2">
      {/* Visual */}
      <div className="lg:sticky lg:top-40 lg:self-start">
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-gradient-to-b from-ivory-warm to-ivory-deep">
          <div className="animate-float">
            <DiamondShapeSvg shape={d.shape} size={260} className="text-glacier-deep drop-shadow-xl" />
          </div>
          <Sparkle className="text-champagne-soft absolute left-[28%] top-[30%]" />
          <Sparkle className="text-champagne-soft absolute right-[30%] top-[40%]" />
          <Sparkle className="text-champagne-soft absolute left-[44%] bottom-[26%]" />
        </div>
        <p className="mt-3 text-center text-[12px] text-ink/45">
          Representative rendering · actual stone graded by {d.authority}
        </p>
      </div>

      {/* Detail */}
      <div className="flex flex-col">
        <span className="eyebrow">{d.authority} Certified Loose Diamond</span>
        <h1 className="mt-2 font-display text-3xl font-semibold text-noir md:text-4xl">
          {d.carat.toFixed(2)} Carat {DIAMOND_SHAPE_LABELS[d.shape]} Diamond
        </h1>
        <p className="mt-1 text-ink/60">
          {d.colour} Color · {d.clarity} Clarity · {d.cut} Cut
        </p>

        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-3xl font-semibold text-noir">{formatMoney(d.price)}</span>
          <span className="text-[12px] text-ink/45">or as low as {formatMoney({ amount: Math.round(d.price.amount / 12), currency: d.price.currency })}/mo</span>
        </div>

        {/* Spec grid */}
        <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-3 border-y border-ink/10 py-6 text-sm sm:grid-cols-3">
          {specs.map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <dt className="text-[10px] font-semibold uppercase tracking-luxe text-ink/40">{k}</dt>
              <dd className="font-medium text-noir">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 flex flex-col gap-3">
          <Button onClick={setInRing} variant="primary" size="lg" className="w-full">
            Set This Diamond in a Ring
          </Button>
          <Button onClick={addLoose} variant="outline" size="lg" className="w-full">
            {added ? (
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4" /> Added to Bag
              </span>
            ) : (
              'Add Loose Diamond to Bag'
            )}
          </Button>
        </div>

        {/* Trust row */}
        <ul className="mt-8 grid grid-cols-1 gap-3 text-[13px] text-ink/60 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-champagne-deep" /> Free shipping
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-champagne-deep" /> 30-day returns
          </li>
          <li className="flex items-center gap-2">
            <Award className="h-4 w-4 text-champagne-deep" /> Lifetime warranty
          </li>
        </ul>
      </div>
    </div>
  );
}
