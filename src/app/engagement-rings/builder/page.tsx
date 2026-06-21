'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useBuilder } from '@/lib/builder/store';
import { getSettings, getDiamonds, getSettingBySlug, getDiamondBySku } from '@/lib/data/diamonds';
import { compatibleDiamonds } from '@/lib/builder/compatibility';
import { computeRingPrice } from '@/lib/builder/pricing';
import { JewelViewer } from '@/components/product/JewelViewer';
import { DiamondShapeSvg } from '@/components/product/DiamondShapeSvg';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { useCart } from '@/lib/commerce/cart';
import { BUYABLE_THRESHOLD } from '@/config/site';
import {
  DIAMOND_SHAPE_LABELS,
  METAL_LABELS,
  type DiamondShape,
  type Metal,
} from '@/types/common';
import type { Diamond, RingSetting } from '@/types/diamond';
import { formatMoney, cn, SHIMMER_BLUR } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const RING_SIZES = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

const METAL_COLORS: Record<Metal, string> = {
  platinum: '#D5D3CF',
  'white-gold': '#C6C4BE',
  'yellow-gold': '#C8A02A',
  'rose-gold': '#BC887A',
};

type SortKey = 'price-asc' | 'price-desc' | 'carat-desc';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qualityTier(cut: string, color: string, clarity: string): string {
  const topColor = ['D', 'E'].includes(color);
  const topClarity = ['FL', 'IF', 'VVS1', 'VVS2'].includes(clarity);
  if (topColor && topClarity && cut === 'Excellent') return 'Exceptional rarity';
  if (topColor && topClarity) return 'Outstanding quality';
  if (cut === 'Excellent' && ['F', 'G'].includes(color)) return 'Superb brilliance';
  return 'Beautiful to the eye';
}

function originLabel(origin?: string, type?: string): string {
  if (type === 'lab-grown') return 'Lab-grown · sustainably created';
  const map: Record<string, string> = {
    Botswana: 'Botswana · ethically sourced',
    Canada: 'Canada · fully traceable',
    Namibia: 'Namibia · conflict-free',
    'South Africa': 'South Africa · certified ethical',
    Russia: 'Russia · GIA verified',
  };
  return origin ? (map[origin] ?? `${origin} · conflict-free`) : '';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const { settingSlug, diamondSku, metal, ringSize, setSetting, setDiamond, setMetal, setRingSize } =
    useBuilder();
  const addToCart = useCart((s) => s.add);

  const allSettings = getSettings();
  const allDiamonds = getDiamonds();
  const setting = settingSlug ? getSettingBySlug(settingSlug) : undefined;
  const diamond = diamondSku ? getDiamondBySku(diamondSku) : undefined;
  const activeMetal: Metal = setting?.metals.includes(metal) ? metal : (setting?.metals[0] ?? metal);

  // Diamond filters
  const [shapeFilter, setShapeFilter] = useState<DiamondShape | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'natural' | 'lab-grown'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('price-asc');

  const basePool = useMemo(
    () => (setting ? compatibleDiamonds(setting, allDiamonds) : allDiamonds),
    [setting, allDiamonds]
  );

  const availableShapes = useMemo(
    () => Array.from(new Set(basePool.map((d) => d.shape))),
    [basePool]
  );

  const filteredDiamonds = useMemo(() => {
    let list = [...basePool];
    if (shapeFilter) list = list.filter((d) => d.shape === shapeFilter);
    if (typeFilter !== 'all') list = list.filter((d) => d.type === typeFilter);
    if (sortKey === 'price-asc') list.sort((a, b) => a.price.amount - b.price.amount);
    else if (sortKey === 'price-desc') list.sort((a, b) => b.price.amount - a.price.amount);
    else list.sort((a, b) => b.carat - a.carat);
    return list;
  }, [basePool, shapeFilter, typeFilter, sortKey]);

  const total = setting && diamond ? computeRingPrice(setting, diamond, activeMetal) : undefined;
  const canBuyOnline = total && total.amount <= BUYABLE_THRESHOLD;
  const isComplete = Boolean(setting && diamond);

  const handleAddToBag = () => {
    if (!setting || !diamond || !total) return;
    addToCart({
      id: `${setting.slug}-${diamond.sku}-${activeMetal}`,
      slug: 'engagement-rings/builder',
      name: `${setting.name} · ${diamond.carat.toFixed(2)}ct ${DIAMOND_SHAPE_LABELS[diamond.shape]}`,
      category: 'engagement-rings',
      image: setting.images[0].src,
      price: total,
      meta: `${METAL_LABELS[activeMetal]}${ringSize ? `, size ${ringSize}` : ''}`,
    });
  };

  // Shared metal controls (used in left panel desktop + right panel mobile)
  const metalControls = (
    <div>
      <p className="text-[9px] uppercase tracking-luxe text-ivory/35 mb-3">
        Metal · {METAL_LABELS[activeMetal]}
      </p>
      <div className="flex gap-3">
        {(setting?.metals ?? (Object.keys(METAL_COLORS) as Metal[])).map((m) => (
          <button
            key={m}
            title={METAL_LABELS[m]}
            onClick={() => setMetal(m)}
            className={cn(
              'h-7 w-7 rounded-full border-2 transition-all duration-200',
              activeMetal === m
                ? 'border-champagne-soft scale-110'
                : 'border-white/0 hover:border-white/30'
            )}
            style={{ backgroundColor: METAL_COLORS[m] }}
          />
        ))}
      </div>
    </div>
  );

  const sizeControls = (
    <div>
      <p className="text-[9px] uppercase tracking-luxe text-ivory/35 mb-3">
        Size {ringSize ? `· ${ringSize}` : ''}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {RING_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setRingSize(s)}
            className={cn(
              'h-8 w-8 border text-xs transition-all duration-200',
              ringSize === s
                ? 'border-champagne bg-champagne/20 text-champagne-soft font-medium'
                : 'border-white/20 text-ivory/45 hover:border-white/50 hover:text-ivory/70'
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="lg:flex">
      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'bg-ink text-ivory flex flex-col',
          'w-full lg:w-[42%] lg:flex-shrink-0',
          'lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-hidden'
        )}
      >
        {/* Viewer */}
        <div className="relative h-72 flex-none overflow-hidden lg:h-[45%]">
          {setting ? (
            <JewelViewer
              model={setting.model3d}
              fallbackImage={setting.images[0]}
              metal={activeMetal}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-6 px-12 text-center">
              <DiamondShapeSvg shape="round" size={88} className="text-ivory/15" />
              <div>
                <p className="text-[9px] uppercase tracking-luxe text-ivory/25">
                  Your ring will appear here
                </p>
                <p className="mt-2 text-xs font-light text-ivory/15">Begin with a setting below</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto border-t border-white/10 px-8 py-7">
          {/* Selection summary */}
          <div className="flex flex-col gap-5 border-b border-white/10 pb-6">
            <a
              href="#section-setting"
              className="group flex items-start justify-between gap-4"
            >
              <div>
                <span className="text-[9px] uppercase tracking-luxe text-ivory/30">Setting</span>
                {setting ? (
                  <>
                    <p className="mt-1 font-display text-xl text-ivory/90 leading-tight">
                      {setting.name}
                    </p>
                    <p className="mt-0.5 text-xs font-light capitalize text-ivory/35">
                      {setting.style.replace('-', ' ')}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-light text-ivory/25">Choose a setting</p>
                )}
              </div>
              {setting && (
                <span className="mt-4 flex-shrink-0 text-[9px] uppercase tracking-luxe text-ivory/25 opacity-0 transition group-hover:opacity-100">
                  change →
                </span>
              )}
            </a>

            <a
              href="#section-diamond"
              className="group flex items-start justify-between gap-4"
            >
              <div>
                <span className="text-[9px] uppercase tracking-luxe text-ivory/30">Diamond</span>
                {diamond ? (
                  <>
                    <p className="mt-1 font-display text-xl text-ivory/90 leading-tight">
                      {diamond.carat.toFixed(2)}ct {DIAMOND_SHAPE_LABELS[diamond.shape]}
                    </p>
                    <p className="mt-0.5 text-xs font-light text-ivory/35">
                      {diamond.cut} · {diamond.color} · {diamond.clarity}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-light text-ivory/25">Choose a diamond</p>
                )}
              </div>
              {diamond && (
                <span className="mt-4 flex-shrink-0 text-[9px] uppercase tracking-luxe text-ivory/25 opacity-0 transition group-hover:opacity-100">
                  change →
                </span>
              )}
            </a>
          </div>

          {/* Metal + Size — desktop */}
          <div className="hidden lg:flex lg:flex-col gap-5 border-b border-white/10 py-6">
            {metalControls}
            {sizeControls}
          </div>

          {/* Price + CTA */}
          <div className="mt-auto pt-6">
            {setting && (
              <div className="mb-5 flex flex-col gap-2 text-xs font-light">
                <div className="flex justify-between text-ivory/35">
                  <span>Setting ({METAL_LABELS[activeMetal]})</span>
                  <span>
                    {formatMoney({
                      amount:
                        setting.basePrice.amount + (setting.metalPriceDelta?.[activeMetal] ?? 0),
                      currency: setting.basePrice.currency,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-ivory/35">
                  <span>Diamond</span>
                  <span>{diamond ? formatMoney(diamond.price) : '—'}</span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between border-t border-white/10 pt-3">
                  <span className="text-[9px] uppercase tracking-luxe text-ivory/40">
                    {total ? 'Total' : 'From'}
                  </span>
                  <span className="font-display text-2xl text-ivory">
                    {formatMoney(
                      total ?? {
                        amount:
                          setting.basePrice.amount +
                          (setting.metalPriceDelta?.[activeMetal] ?? 0),
                        currency: setting.basePrice.currency,
                      }
                    )}
                  </span>
                </div>
              </div>
            )}

            {isComplete ? (
              canBuyOnline ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleAddToBag}
                    className="w-full bg-champagne px-6 py-4 text-[10px] uppercase tracking-luxe text-ink transition hover:bg-champagne-soft"
                  >
                    Add to Bag
                  </button>
                  {total && (
                    <p className="text-center text-[9px] font-light text-ivory/25">
                      or 12 interest-free payments of{' '}
                      {formatMoney({ amount: Math.round(total.amount / 12), currency: total.currency })}
                    </p>
                  )}
                </div>
              ) : (
                <EnquiryModal
                  triggerLabel="Request a Quote"
                  triggerClassName="w-full border border-champagne/40 px-6 py-4 text-[10px] uppercase tracking-luxe text-ivory/80 transition hover:border-champagne hover:text-ivory"
                  title="Reserve Your Creation"
                  subtitle="This bespoke ring is created to order. A specialist will guide you through the final steps."
                  type="bespoke"
                  source="builder"
                  builtRing={{
                    settingSlug: setting!.slug,
                    diamondSku: diamond!.sku,
                    metal: activeMetal,
                  }}
                />
              )
            ) : (
              <p className="py-3 text-center text-[9px] uppercase tracking-luxe text-ivory/20">
                {!setting ? 'Choose a setting to begin' : 'Choose a diamond to continue'}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="flex-1 bg-ivory">
        {/* ── Settings ──────────────────────────────────────────────────────── */}
        <section id="section-setting" className="px-8 py-16 lg:px-14 lg:py-20">
          <div className="mb-10">
            <span className="eyebrow">The Setting</span>
            <h2 className="mt-3 font-display text-4xl font-light text-ink">Choose Your Setting</h2>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ink/50">
              Each setting is hand-finished in our London atelier. Choose the architecture —
              the diamond follows.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px bg-ink/8 sm:grid-cols-2 xl:grid-cols-3">
            {allSettings.map((s) => (
              <SettingCard
                key={s.id}
                setting={s}
                selected={settingSlug === s.slug}
                onSelect={() => setSetting(s.slug)}
              />
            ))}
          </div>
        </section>

        <div className="h-px bg-ink/10" />

        {/* ── Diamonds ──────────────────────────────────────────────────────── */}
        <section id="section-diamond" className="py-16 lg:py-20">
          <div className="mb-10 px-8 lg:px-14">
            <span className="eyebrow">The Diamond</span>
            <h2 className="mt-3 font-display text-4xl font-light text-ink">Choose Your Diamond</h2>
            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ink/50">
              {setting
                ? `Showing stones compatible with the ${setting.name}. All are GIA or IGI certified and personally selected.`
                : 'All diamonds are GIA or IGI certified and personally selected from ethically sourced rough.'}
            </p>
          </div>

          {/* Shape filter */}
          <div className="border-y border-ink/10">
            <div className="overflow-x-auto px-8 lg:px-14">
              <div className="flex min-w-max items-end gap-0 py-5">
                <ShapeButton
                  label="All"
                  active={shapeFilter === null}
                  onClick={() => setShapeFilter(null)}
                />
                {availableShapes.map((s) => (
                  <ShapeButton
                    key={s}
                    shape={s}
                    label={DIAMOND_SHAPE_LABELS[s]}
                    active={shapeFilter === s}
                    onClick={() => setShapeFilter(shapeFilter === s ? null : s)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center justify-between px-8 py-5 lg:px-14">
            <div className="inline-flex border border-ink/15">
              {(['all', 'natural', 'lab-grown'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'px-4 py-2.5 text-[10px] uppercase tracking-luxe transition-colors duration-200',
                    typeFilter === t ? 'bg-ink text-ivory' : 'text-ink/45 hover:text-ink'
                  )}
                >
                  {t === 'all' ? 'All' : t === 'natural' ? 'Natural' : 'Lab-Grown'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-ink/35">
              <span className="uppercase tracking-luxe">
                {filteredDiamonds.length} {filteredDiamonds.length === 1 ? 'stone' : 'stones'}
              </span>
              <span>·</span>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-transparent uppercase tracking-luxe outline-none hover:text-ink"
              >
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="carat-desc">Carat ↓</option>
              </select>
            </div>
          </div>

          {/* Diamond grid */}
          <div className="px-8 lg:px-14">
            {filteredDiamonds.length === 0 ? (
              <p className="py-16 text-center text-sm font-light text-ink/40">
                No stones match your selection.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-px bg-ink/8 sm:grid-cols-2 xl:grid-cols-3">
                {filteredDiamonds.map((d) => (
                  <DiamondCard
                    key={d.id}
                    diamond={d}
                    selected={d.sku === diamondSku}
                    onSelect={() => setDiamond(d.sku)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Metal + Size + CTA — mobile only ─────────────────────────────── */}
        <section className="border-t border-ink/10 bg-ink px-8 py-14 text-ivory lg:hidden">
          <div className="mb-10">
            <span className="eyebrow text-champagne-soft">Finish Your Ring</span>
            <h2 className="mt-3 font-display text-4xl font-light">Metal &amp; Size</h2>
          </div>

          <div className="flex flex-col gap-8">
            {/* Re-render metal/size on dark bg for mobile */}
            <div>
              <p className="text-[9px] uppercase tracking-luxe text-ivory/35 mb-3">
                Metal · {METAL_LABELS[activeMetal]}
              </p>
              <div className="flex gap-4">
                {(setting?.metals ?? (Object.keys(METAL_COLORS) as Metal[])).map((m) => (
                  <button
                    key={m}
                    title={METAL_LABELS[m]}
                    onClick={() => setMetal(m)}
                    className={cn(
                      'flex flex-col items-center gap-2'
                    )}
                  >
                    <span
                      className={cn(
                        'h-10 w-10 rounded-full border-2 transition-all duration-200',
                        activeMetal === m
                          ? 'border-champagne-soft scale-110'
                          : 'border-white/0 hover:border-white/30'
                      )}
                      style={{ backgroundColor: METAL_COLORS[m] }}
                    />
                    <span className="text-[8px] uppercase tracking-luxe text-ivory/35">
                      {METAL_LABELS[m].split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-luxe text-ivory/35 mb-3">
                Ring Size {ringSize ? `· ${ringSize}` : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                {RING_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setRingSize(s)}
                    className={cn(
                      'h-11 w-11 border text-sm transition',
                      ringSize === s
                        ? 'border-champagne bg-champagne/20 text-champagne-soft'
                        : 'border-white/20 text-ivory/45 hover:border-white/50 hover:text-ivory'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {isComplete ? (
              canBuyOnline ? (
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleAddToBag}
                    className="w-full bg-champagne px-6 py-5 text-[10px] uppercase tracking-luxe text-ink transition hover:bg-champagne-soft"
                  >
                    Add to Bag — {total && formatMoney(total)}
                  </button>
                  {total && (
                    <p className="text-center text-[9px] font-light text-ivory/30">
                      or 12 interest-free payments of{' '}
                      {formatMoney({
                        amount: Math.round(total.amount / 12),
                        currency: total.currency,
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <EnquiryModal
                  triggerLabel="Request a Quote"
                  triggerClassName="w-full border border-champagne/50 px-6 py-5 text-[10px] uppercase tracking-luxe text-ivory transition hover:border-champagne"
                  title="Reserve Your Creation"
                  subtitle="This bespoke ring is created to order. A specialist will guide you through the final steps."
                  type="bespoke"
                  source="builder"
                  builtRing={{
                    settingSlug: setting!.slug,
                    diamondSku: diamond!.sku,
                    metal: activeMetal,
                  }}
                />
              )
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Setting card ─────────────────────────────────────────────────────────────

function SettingCard({
  setting: s,
  selected,
  onSelect,
}: {
  setting: RingSetting;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="group relative aspect-[3/4] w-full overflow-hidden bg-ink text-left"
    >
      <Image
        src={s.images[0].src}
        alt={s.images[0].alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        placeholder="blur"
        blurDataURL={SHIMMER_BLUR}
        className="object-cover transition-transform duration-700 ease-luxe group-hover:scale-105"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/15 to-transparent" />

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <p className="text-[9px] uppercase tracking-luxe text-champagne-soft/80 capitalize">
          {s.style.replace('-', ' ')}
        </p>
        <h3 className="mt-1.5 font-display text-2xl font-light text-ivory">{s.name}</h3>
        <p className="mt-1 text-xs font-light text-ivory/45">
          From {formatMoney(s.basePrice)}
        </p>
      </div>

      {/* Selected overlay */}
      {selected && (
        <>
          <div className="pointer-events-none absolute inset-0 border-2 border-champagne" />
          <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-champagne">
            <Check className="h-3.5 w-3.5 text-ink" strokeWidth={2.5} />
          </div>
        </>
      )}
    </button>
  );
}

// ─── Diamond card ─────────────────────────────────────────────────────────────

function DiamondCard({
  diamond: d,
  selected,
  onSelect,
}: {
  diamond: Diamond;
  selected: boolean;
  onSelect: () => void;
}) {
  const tier = qualityTier(d.cut, d.color, d.clarity);
  const origin = originLabel(d.origin, d.type);

  return (
    <div className="group relative flex flex-col bg-ivory">
      {selected && (
        <div className="pointer-events-none absolute inset-0 z-10 border-2 border-champagne" />
      )}
      {selected && (
        <span className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-champagne text-ivory shadow-sm">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      )}

      {/* Dark upper */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center px-8 py-10 transition-colors duration-500',
          selected ? 'bg-ink-soft' : 'bg-ink group-hover:bg-ink-soft'
        )}
      >
        <div
          className={cn(
            'transition-colors duration-500',
            selected ? 'text-champagne-soft' : 'text-ivory/45 group-hover:text-ivory/75'
          )}
        >
          <DiamondShapeSvg shape={d.shape} size={72} />
        </div>
        <div className="mt-6 flex items-baseline gap-1.5 text-ivory">
          <span className="font-display text-5xl font-light leading-none">
            {d.carat.toFixed(2)}
          </span>
          <span className="text-[9px] uppercase tracking-luxe text-champagne-soft/70">ct</span>
        </div>
        <p className="mt-2 text-[9px] uppercase tracking-luxe text-ivory/25">{tier}</p>
      </div>

      {/* Ivory lower */}
      <div className="flex flex-1 flex-col p-6">
        <span className="eyebrow mb-3">{DIAMOND_SHAPE_LABELS[d.shape]}</span>
        <p className="text-sm font-light leading-relaxed text-ink/65">
          {d.cut} Cut &nbsp;·&nbsp; Colour&nbsp;{d.color} &nbsp;·&nbsp; {d.clarity}
        </p>
        {origin && (
          <p className="mt-1.5 text-xs font-light text-ink/38">{origin}</p>
        )}
        <p className="mt-1.5 text-[9px] uppercase tracking-luxe text-ink/28">
          {d.certification.authority} Certified
          {d.certification.reportNumber && (
            <span className="ml-1 font-light normal-case tracking-wide text-ink/22">
              #{d.certification.reportNumber}
            </span>
          )}
        </p>

        <div className="mt-auto pt-6">
          <p className="font-display text-2xl text-ink">{formatMoney(d.price)}</p>
          <button
            onClick={onSelect}
            className={cn(
              'mt-4 w-full border py-4 text-[10px] uppercase tracking-luxe transition-all duration-300',
              selected
                ? 'border-champagne bg-champagne text-ivory'
                : 'border-ink/18 text-ink/60 hover:border-ink hover:bg-ink hover:text-ivory'
            )}
          >
            {selected ? 'Stone Selected ✓' : 'Choose this Stone'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shape selector ──────────────────────────────────────────────────────────

function ShapeButton({
  shape,
  label,
  active,
  onClick,
}: {
  shape?: DiamondShape;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-2 px-4 pb-0 transition-colors duration-200',
        active ? 'text-ink' : 'text-ink/28 hover:text-ink/55'
      )}
    >
      {shape ? (
        <DiamondShapeSvg shape={shape} size={28} />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center">
          <span className="grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors duration-200',
                  active ? 'bg-ink' : 'bg-ink/28 group-hover:bg-ink/55'
                )}
              />
            ))}
          </span>
        </span>
      )}
      <span
        className={cn(
          'text-[8px] uppercase tracking-luxe transition-colors duration-200',
          active ? 'text-champagne-deep' : ''
        )}
      >
        {shape ? label.split(' ')[0] : label}
      </span>
      <span
        className={cn(
          'h-px w-full transition-all duration-300',
          active ? 'bg-champagne' : 'bg-transparent'
        )}
      />
    </button>
  );
}
