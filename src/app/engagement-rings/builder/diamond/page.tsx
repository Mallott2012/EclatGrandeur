'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useBuilder } from '@/lib/builder/store';
import { getDiamonds, getSettingBySlug } from '@/lib/data/diamonds';
import { compatibleDiamonds } from '@/lib/builder/compatibility';
import { DiamondShapeSvg } from '@/components/product/DiamondShapeSvg';
import { DIAMOND_SHAPE_LABELS, type DiamondShape } from '@/types/common';
import type { Diamond } from '@/types/diamond';
import { formatMoney, cn } from '@/lib/utils';

type SortKey = 'price-asc' | 'price-desc' | 'carat-desc';

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

export default function DiamondStep() {
  const router = useRouter();
  const { settingSlug, diamondSku, setDiamond } = useBuilder();
  const setting = settingSlug ? getSettingBySlug(settingSlug) : undefined;

  const all = getDiamonds();
  const available = useMemo(
    () => (setting ? compatibleDiamonds(setting, all) : all),
    [setting, all]
  );

  const shapes = useMemo(
    () => Array.from(new Set(available.map((d) => d.shape))),
    [available]
  );

  const [shape, setShape] = useState<DiamondShape | null>(null);
  const [type, setType] = useState<'all' | 'natural' | 'lab-grown'>('all');
  const [sort, setSort] = useState<SortKey>('price-asc');

  const diamonds = useMemo(() => {
    let list = [...available];
    if (shape) list = list.filter((d) => d.shape === shape);
    if (type !== 'all') list = list.filter((d) => d.type === type);
    if (sort === 'price-asc') list.sort((a, b) => a.price.amount - b.price.amount);
    else if (sort === 'price-desc') list.sort((a, b) => b.price.amount - a.price.amount);
    else list.sort((a, b) => b.carat - a.carat);
    return list;
  }, [available, shape, type, sort]);

  const choose = (d: Diamond) => {
    setDiamond(d.sku);
    router.push(
      settingSlug ? '/engagement-rings/builder/review' : '/engagement-rings/builder/setting'
    );
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="container-luxe py-14 text-center">
        <span className="eyebrow">Step Two</span>
        <h1 className="mt-4 font-display text-5xl font-light text-ink md:text-6xl">
          Choose Your Diamond
        </h1>
        {setting ? (
          <p className="mt-4 text-sm font-light text-ink/55">
            Showing stones compatible with the{' '}
            <span className="text-ink">{setting.name}</span>.
          </p>
        ) : (
          <p className="mt-4 text-sm font-light text-ink/55">
            No setting chosen yet —{' '}
            <Link
              href="/engagement-rings/builder/setting"
              className="text-ink underline underline-offset-4 hover:text-champagne-deep"
            >
              choose a setting first
            </Link>{' '}
            to filter compatible stones.
          </p>
        )}
      </div>

      {/* Shape selector */}
      <div className="border-y border-ink/10">
        <div className="container-luxe overflow-x-auto">
          <div className="flex min-w-max items-end gap-0 py-5 md:min-w-0 md:justify-center">
            <ShapeButton
              label="All"
              active={shape === null}
              onClick={() => setShape(null)}
            />
            {shapes.map((s) => (
              <ShapeButton
                key={s}
                shape={s}
                label={DIAMOND_SHAPE_LABELS[s]}
                active={shape === s}
                onClick={() => setShape(shape === s ? null : s)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="container-luxe flex items-center justify-between py-6">
        {/* Type toggle */}
        <div className="inline-flex border border-ink/15">
          {(['all', 'natural', 'lab-grown'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                'px-5 py-2.5 text-[10px] uppercase tracking-luxe transition-colors duration-200',
                type === t ? 'bg-ink text-ivory' : 'text-ink/50 hover:text-ink'
              )}
            >
              {t === 'all' ? 'All' : t === 'natural' ? 'Natural' : 'Lab-Grown'}
            </button>
          ))}
        </div>

        {/* Count + sort */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-luxe text-ink/40">
            {diamonds.length} {diamonds.length === 1 ? 'stone' : 'stones'}
          </span>
          <span className="text-ink/20">·</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-transparent text-[10px] uppercase tracking-luxe text-ink/50 outline-none hover:text-ink"
          >
            <option value="price-asc">Price ↑</option>
            <option value="price-desc">Price ↓</option>
            <option value="carat-desc">Carat ↓</option>
          </select>
        </div>
      </div>

      {/* Diamond grid */}
      <div className="container-luxe">
        {diamonds.length === 0 ? (
          <p className="py-24 text-center text-sm font-light text-ink/45">
            No stones match your selection.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-ink/8 sm:grid-cols-2 lg:grid-cols-3">
            {diamonds.map((d) => (
              <DiamondCard
                key={d.id}
                diamond={d}
                selected={d.sku === diamondSku}
                onSelect={() => choose(d)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shape selector button ───────────────────────────────────────────────────

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
  const shortLabel = shape ? label.split(' ')[0] : label;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-center gap-2 px-4 pb-0 transition-colors duration-200',
        active ? 'text-ink' : 'text-ink/30 hover:text-ink/60'
      )}
    >
      {shape ? (
        <DiamondShapeSvg shape={shape} size={30} />
      ) : (
        <span className="flex h-[30px] w-[30px] items-center justify-center">
          <span className="grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors duration-200',
                  active ? 'bg-ink' : 'bg-ink/30 group-hover:bg-ink/60'
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
        {shortLabel}
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

// ─── Diamond card ────────────────────────────────────────────────────────────

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
    <div className={cn('group relative flex flex-col bg-ivory transition-all duration-300')}>
      {/* Champagne border overlay when selected */}
      {selected && (
        <div className="pointer-events-none absolute inset-0 z-10 border-2 border-champagne" />
      )}

      {/* Selected badge */}
      {selected && (
        <span className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-champagne text-ivory shadow-sm">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      )}

      {/* ── Dark upper half ──────────────────────────────────────── */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center px-8 py-12 transition-colors duration-500',
          selected ? 'bg-ink-soft' : 'bg-ink group-hover:bg-ink-soft'
        )}
      >
        {/* Diamond silhouette */}
        <div
          className={cn(
            'transition-colors duration-500',
            selected
              ? 'text-champagne-soft'
              : 'text-ivory/50 group-hover:text-ivory/80'
          )}
        >
          <DiamondShapeSvg shape={d.shape} size={80} />
        </div>

        {/* Carat — hero stat */}
        <div className="mt-7 flex items-baseline gap-1.5 text-ivory">
          <span className="font-display text-5xl font-light leading-none">
            {d.carat.toFixed(2)}
          </span>
          <span className="text-[9px] uppercase tracking-luxe text-champagne-soft/80">ct</span>
        </div>

        {/* Quality descriptor */}
        <p className="mt-2 text-[9px] uppercase tracking-luxe text-ivory/30">{tier}</p>
      </div>

      {/* ── Ivory lower half ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-6">
        {/* Shape eyebrow */}
        <span className="eyebrow mb-3">{DIAMOND_SHAPE_LABELS[d.shape]}</span>

        {/* Character line */}
        <p className="text-sm font-light leading-relaxed text-ink/70">
          {d.cut} Cut &nbsp;·&nbsp; Colour&nbsp;{d.color} &nbsp;·&nbsp; {d.clarity}
        </p>

        {/* Origin / provenance */}
        {origin && (
          <p className="mt-1.5 text-xs font-light leading-relaxed text-ink/40">{origin}</p>
        )}

        {/* Certification */}
        <p className="mt-1.5 text-[9px] uppercase tracking-luxe text-ink/30">
          {d.certification.authority} Certified
          {d.certification.reportNumber && (
            <span className="ml-1 font-light normal-case tracking-wide text-ink/25">
              #{d.certification.reportNumber}
            </span>
          )}
        </p>

        <div className="mt-auto pt-6">
          {/* Price */}
          <p className="font-display text-2xl text-ink">{formatMoney(d.price)}</p>

          {/* CTA */}
          <button
            onClick={onSelect}
            className={cn(
              'mt-4 w-full border py-4 text-[10px] uppercase tracking-luxe transition-all duration-300',
              selected
                ? 'border-champagne bg-champagne text-ivory'
                : 'border-ink/20 text-ink/70 hover:border-ink hover:bg-ink hover:text-ivory'
            )}
          >
            {selected ? 'Stone Selected ✓' : 'Choose this Stone'}
          </button>
        </div>
      </div>
    </div>
  );
}
