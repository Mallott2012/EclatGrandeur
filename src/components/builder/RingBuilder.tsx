'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronLeft, RotateCcw, Diamond as DiamondIcon } from 'lucide-react';
import { JewelArt } from '@/components/art/JewelArt';
import { DiamondShapeSvg } from '@/components/art/Diamond';
import { Button } from '@/components/ui/Button';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { useBuilder } from '@/lib/store/builder';
import { useCart } from '@/lib/store/cart';
import { isCompatible, priceBuild } from '@/lib/builder';
import { formatMoney, cn } from '@/lib/utils';
import {
  DIAMOND_SHAPE_LABELS,
  METAL_LABELS,
  METAL_SWATCH,
  type Setting,
  type Diamond,
  type DiamondShape,
  type Metal,
} from '@/types';

const STEPS = ['Setting', 'Diamond', 'Review'] as const;

function caratToVisual(carat: number) {
  return Math.max(0.7, Math.min(1.4, 0.6 + carat * 0.35));
}

export function RingBuilder({ settings, diamonds }: { settings: Setting[]; diamonds: Diamond[] }) {
  const { settingId, diamondId, metal, setSetting, setDiamond, setMetal, reset } = useBuilder();
  const [step, setStep] = useState(0);
  const [shapeFilter, setShapeFilter] = useState<DiamondShape | null>(null);
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'carat'>('price-asc');
  const [enquire, setEnquire] = useState(false);
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  const setting = settings.find((s) => s.id === settingId) ?? null;
  const diamond = diamonds.find((d) => d.id === diamondId) ?? null;

  const compatibleDiamonds = useMemo(() => {
    if (!setting) return [];
    let list = diamonds.filter((d) => isCompatible(setting, d));
    if (shapeFilter) list = list.filter((d) => d.shape === shapeFilter);
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price.amount - b.price.amount);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price.amount - a.price.amount);
    else list = [...list].sort((a, b) => b.carat - a.carat);
    return list;
  }, [setting, diamonds, shapeFilter, sort]);

  const availableShapes = useMemo(() => {
    if (!setting) return [];
    return setting.shapes.filter((sh) => diamonds.some((d) => d.shape === sh));
  }, [setting, diamonds]);

  const price = setting && diamond ? priceBuild(setting, diamond, metal) : null;

  const previewMetal: Metal = metal;
  const previewArt = setting
    ? {
        kind: setting.kind,
        shape: diamond?.shape ?? (setting.shapes[0] as DiamondShape),
        metal: previewMetal,
        caratVisual: diamond ? caratToVisual(diamond.carat) : 1,
      }
    : null;

  const onAddToBag = () => {
    if (!setting || !diamond || !price) return;
    add({
      id: `build-${setting.id}-${diamond.id}-${metal}`,
      name: `${setting.name} · ${diamond.carat}ct ${DIAMOND_SHAPE_LABELS[diamond.shape]}`,
      href: '/builder',
      price: price.total,
      meta: `${METAL_LABELS[metal]} · ${diamond.colour} ${diamond.clarity}`,
      art: previewArt!,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const goReview = () => setStep(2);

  return (
    <div className="container-luxe py-10 md:py-14">
      {/* Step header */}
      <div className="mb-10 flex flex-col items-center gap-6">
        <h1 className="font-display text-4xl font-light md:text-5xl">Design Your Ring</h1>
        <ol className="flex items-center gap-3 md:gap-5">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            const reachable = i <= step || (i === 1 && setting) || (i === 2 && setting && diamond);
            return (
              <li key={label} className="flex items-center gap-3 md:gap-5">
                <button
                  disabled={!reachable}
                  onClick={() => reachable && setStep(i)}
                  className={cn(
                    'flex items-center gap-2.5 text-[11px] uppercase tracking-luxe transition',
                    current ? 'text-ink' : done ? 'text-champagne-deep' : 'text-ink/35',
                    reachable && 'hover:text-ink'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full border text-[11px]',
                      current ? 'border-noir bg-noir text-ivory' : done ? 'border-champagne bg-champagne text-noir' : 'border-ink/25'
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-ink/15 md:w-10" />}
              </li>
            );
          })}
        </ol>
      </div>

      {/* STEP 1 — setting */}
      {step === 0 && (
        <div>
          <p className="mb-8 text-center text-sm font-light text-ink/60">Begin by choosing a setting style.</p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {settings.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSetting(s.id);
                  if (diamond && !isCompatible(s, diamond)) setDiamond('');
                  setStep(1);
                }}
                className={cn(
                  'group flex flex-col border p-4 text-left transition',
                  settingId === s.id ? 'border-noir shadow-card' : 'border-ink/15 hover:border-ink'
                )}
              >
                <div className="aspect-square overflow-hidden bg-ivory-deep">
                  <JewelArt art={{ kind: s.kind, shape: 'round', metal: 'platinum', caratVisual: 1 }} gid={`set-${s.id}`} className="h-full w-full transition-transform duration-500 group-hover:scale-105" />
                </div>
                <h3 className="mt-4 font-display text-xl text-ink">{s.name}</h3>
                <p className="mt-1 text-[13px] font-light leading-relaxed text-ink/55">{s.description}</p>
                <span className="mt-3 text-[11px] uppercase tracking-luxe text-champagne-deep">From {formatMoney(s.basePrice)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 — diamond */}
      {step === 1 && setting && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <button onClick={() => setStep(0)} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe text-ink/60 hover:text-ink">
              <ChevronLeft className="h-4 w-4" /> Setting: {setting.name}
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="border border-ink/20 bg-transparent px-3 py-2 text-[11px] uppercase tracking-luxe focus:border-champagne focus:outline-none"
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="carat">Carat: High to Low</option>
            </select>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Chip active={shapeFilter === null} onClick={() => setShapeFilter(null)}>All shapes</Chip>
            {availableShapes.map((sh) => (
              <Chip key={sh} active={shapeFilter === sh} onClick={() => setShapeFilter(sh)}>
                <span className="inline-flex items-center gap-2">
                  <DiamondShapeSvg shape={sh} size={16} /> {DIAMOND_SHAPE_LABELS[sh]}
                </span>
              </Chip>
            ))}
          </div>

          <div className="overflow-hidden border border-ink/10">
            <div className="hidden grid-cols-12 gap-2 border-b border-ink/10 bg-ivory-warm px-5 py-3 text-[10px] uppercase tracking-luxe text-ink/45 md:grid">
              <span className="col-span-3">Shape</span>
              <span className="col-span-1">Carat</span>
              <span className="col-span-2">Colour</span>
              <span className="col-span-2">Clarity</span>
              <span className="col-span-2">Cut</span>
              <span className="col-span-2 text-right">Price</span>
            </div>
            <ul>
              {compatibleDiamonds.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => { setDiamond(d.id); goReview(); }}
                    className={cn(
                      'grid w-full grid-cols-2 items-center gap-2 border-b border-ink/8 px-5 py-4 text-left text-sm transition hover:bg-ivory-warm md:grid-cols-12',
                      diamondId === d.id && 'bg-ivory-warm'
                    )}
                  >
                    <span className="col-span-2 flex items-center gap-3 md:col-span-3">
                      <DiamondShapeSvg shape={d.shape} size={26} className="text-glacier-deep" />
                      <span className="font-light">{DIAMOND_SHAPE_LABELS[d.shape]}</span>
                    </span>
                    <span className="col-span-1 font-light">{d.carat.toFixed(2)}</span>
                    <span className="col-span-2 font-light">{d.colour}</span>
                    <span className="col-span-2 font-light">{d.clarity}</span>
                    <span className="col-span-2 font-light">{d.cut}</span>
                    <span className="col-span-2 text-right font-medium">{formatMoney(d.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* STEP 3 — review */}
      {step === 2 && setting && diamond && price && previewArt && (
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="lg:sticky lg:top-40 lg:self-start">
            <div className="aspect-[4/5] overflow-hidden bg-ivory-deep">
              <JewelArt art={previewArt} gid="builder-review" className="h-full w-full animate-float" />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="eyebrow">Your Creation</span>
            <h2 className="mt-3 font-display text-4xl font-light">{setting.name}</h2>
            <p className="mt-2 font-light text-ink/60">
              {diamond.carat.toFixed(2)}ct {DIAMOND_SHAPE_LABELS[diamond.shape]} · {diamond.colour} {diamond.clarity} · {diamond.cut} cut
            </p>

            {/* Metal */}
            <div className="mt-7">
              <span className="text-[11px] uppercase tracking-luxe text-ink/50">Metal — {METAL_LABELS[metal]}</span>
              <div className="mt-3 flex items-center gap-2.5">
                {setting.metals.map((m) => {
                  const sw = METAL_SWATCH[m];
                  return (
                    <button
                      key={m}
                      aria-label={METAL_LABELS[m]}
                      title={METAL_LABELS[m]}
                      onClick={() => setMetal(m)}
                      className={cn('h-8 w-8 rounded-full border transition', metal === m ? 'border-noir ring-1 ring-noir ring-offset-2 ring-offset-ivory' : 'border-ink/20 hover:border-ink')}
                      style={{ background: `linear-gradient(135deg, ${sw.light}, ${sw.base} 55%, ${sw.deep})` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Price breakdown */}
            <dl className="mt-8 flex flex-col gap-3 border-y border-ink/10 py-6 text-sm">
              <div className="flex justify-between"><dt className="text-ink/55">Setting ({METAL_LABELS[metal]})</dt><dd>{formatMoney(price.setting)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/55">Diamond ({diamond.authority} {diamond.report.split(' ')[1] ?? ''})</dt><dd>{formatMoney(price.diamond)}</dd></div>
              <div className="mt-1 flex items-baseline justify-between border-t border-ink/10 pt-4">
                <dt className="font-display text-xl">Total</dt>
                <dd className="font-display text-2xl">{formatMoney(price.total)}</dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-col gap-3">
              {price.buyableOnline ? (
                <Button onClick={onAddToBag} variant="primary" size="lg" className="w-full">
                  {added ? <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Added to Bag</span> : 'Add to Bag'}
                </Button>
              ) : (
                <Button onClick={() => setEnquire(true)} variant="gold" size="lg" className="w-full">
                  Request a Quote
                </Button>
              )}
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe text-ink/55 hover:text-ink">
                  <ChevronLeft className="h-4 w-4" /> Change diamond
                </button>
                <button onClick={() => { reset(); setStep(0); }} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe text-ink/55 hover:text-ink">
                  <RotateCcw className="h-3.5 w-3.5" /> Start over
                </button>
              </div>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-[12px] font-light text-ink/50">
              <DiamondIcon className="h-4 w-4 text-champagne-deep" /> Hand-finished to order in our London atelier, with full certification.
            </p>
          </div>
        </div>
      )}

      <EnquiryModal
        open={enquire}
        onClose={() => setEnquire(false)}
        title="Request a Quote"
        context={setting && diamond ? `Bespoke build: ${setting.name}, ${diamond.carat}ct ${diamond.shape}, ${metal}` : undefined}
        intro="Your design is ready. Share your details and our concierge will prepare a formal quotation."
      />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('border px-3.5 py-2 text-[11px] uppercase tracking-luxe transition', active ? 'border-noir bg-noir text-ivory' : 'border-ink/20 text-ink hover:border-ink')}
    >
      {children}
    </button>
  );
}
