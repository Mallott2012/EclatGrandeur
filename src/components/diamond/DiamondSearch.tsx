'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, RotateCcw, ArrowRight } from 'lucide-react';
import { DiamondShapeSvg } from '@/components/art/Diamond';
import { RangeSlider } from './RangeSlider';
import { formatMoney, cn } from '@/lib/utils';
import {
  COLOUR_SCALE,
  CLARITY_SCALE,
  CUT_SCALE,
  defaultFilters,
  inventoryBounds,
  filterDiamonds,
  sortDiamonds,
  type DiamondFilters,
  type SortKey,
} from '@/lib/diamondSearch';
import {
  DIAMOND_SHAPE_LABELS,
  type Diamond,
  type DiamondShape,
} from '@/types';

const ALL_SHAPES = Object.keys(DIAMOND_SHAPE_LABELS) as DiamondShape[];

type Column = { key: SortKey; label: string; className?: string };
const COLUMNS: Column[] = [
  { key: 'carat-desc', label: 'Carat' },
  { key: 'cut', label: 'Cut' },
  { key: 'colour', label: 'Color' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'price-asc', label: 'Price', className: 'text-right' },
];

export function DiamondSearch({
  diamonds,
  restrictShapes,
  initialShape,
  onSelect,
  selectLabel = 'View Diamond',
  heading = 'Search Diamonds',
}: {
  diamonds: Diamond[];
  /** Limit to shapes a chosen setting accepts (builder flow). */
  restrictShapes?: DiamondShape[];
  initialShape?: DiamondShape;
  /** When provided, the row action calls this instead of linking out. */
  onSelect?: (d: Diamond) => void;
  selectLabel?: string;
  heading?: string;
}) {
  const pool = useMemo(
    () =>
      restrictShapes && restrictShapes.length
        ? diamonds.filter((d) => restrictShapes.includes(d.shape))
        : diamonds,
    [diamonds, restrictShapes]
  );

  const bounds = useMemo(() => inventoryBounds(pool), [pool]);
  const [filters, setFilters] = useState<DiamondFilters>(() => ({
    ...defaultFilters(pool),
    shapes: initialShape ? [initialShape] : [],
  }));
  const [sort, setSort] = useState<SortKey>('price-asc');

  const shapeOptions = useMemo(() => {
    const allowed = restrictShapes ?? ALL_SHAPES;
    return ALL_SHAPES.filter((s) => allowed.includes(s));
  }, [restrictShapes]);

  const results = useMemo(
    () => sortDiamonds(filterDiamonds(pool, filters), sort),
    [pool, filters, sort]
  );

  const patch = (p: Partial<DiamondFilters>) => setFilters((f) => ({ ...f, ...p }));
  const toggleShape = (s: DiamondShape) =>
    setFilters((f) => ({
      ...f,
      shapes: f.shapes.includes(s) ? f.shapes.filter((x) => x !== s) : [...f.shapes, s],
    }));
  const resetAll = () =>
    setFilters({ ...defaultFilters(pool), shapes: [] });

  const priceStep = Math.max(
    1000,
    Math.round((bounds.priceMax - bounds.priceMin) / 100 / 1000) * 1000
  );

  const setSortFromHeader = (key: SortKey) => {
    // toggle asc/desc on price & carat columns
    if (key === 'price-asc') setSort(sort === 'price-asc' ? 'price-desc' : 'price-asc');
    else if (key === 'carat-desc') setSort(sort === 'carat-desc' ? 'carat-asc' : 'carat-desc');
    else setSort(key);
  };

  return (
    <div className="container-luxe py-8 md:py-12">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold text-noir md:text-4xl">{heading}</h1>
        <p className="text-sm text-ink/60">
          {results.length.toLocaleString()} certified diamonds match your selection.
        </p>
      </div>

      {/* Shape selector */}
      <div className="mb-7">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-luxe text-ink/50">
          Shape
        </div>
        <div className="flex flex-wrap gap-2">
          {shapeOptions.map((s) => {
            const active = filters.shapes.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleShape(s)}
                className={cn(
                  'flex w-[84px] flex-col items-center gap-1.5 rounded-md border px-2 py-3 text-[10px] font-medium uppercase tracking-wide transition',
                  active
                    ? 'border-champagne bg-champagne/10 text-champagne-deep'
                    : 'border-ink/15 text-ink/60 hover:border-champagne hover:text-champagne-deep'
                )}
              >
                <DiamondShapeSvg shape={s} size={28} className={active ? 'text-champagne-deep' : 'text-ink/50'} />
                {DIAMOND_SHAPE_LABELS[s].replace(' Brilliant', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders */}
      <div className="mb-8 grid grid-cols-1 gap-x-12 gap-y-7 rounded-lg border border-ink/10 bg-ivory-warm p-6 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Price">
          <RangeSlider
            min={bounds.priceMin}
            max={bounds.priceMax}
            step={priceStep}
            valueMin={filters.priceMin}
            valueMax={filters.priceMax}
            onChange={(lo, hi) => patch({ priceMin: lo, priceMax: hi })}
            formatValue={(v) => formatMoney({ amount: v, currency: 'USD' })}
          />
        </Field>

        <Field label="Carat">
          <RangeSlider
            min={bounds.caratMin}
            max={bounds.caratMax}
            step={0.1}
            valueMin={filters.caratMin}
            valueMax={filters.caratMax}
            onChange={(lo, hi) => patch({ caratMin: lo, caratMax: hi })}
            formatValue={(v) => v.toFixed(2)}
          />
        </Field>

        <Field label="Cut">
          <RangeSlider
            min={0}
            max={CUT_SCALE.length - 1}
            valueMin={filters.cutMin}
            valueMax={filters.cutMax}
            onChange={(lo, hi) => patch({ cutMin: lo, cutMax: hi })}
            formatValue={(v) => CUT_SCALE[v]}
            ticks={CUT_SCALE}
          />
        </Field>

        <Field label="Color">
          <RangeSlider
            min={0}
            max={COLOUR_SCALE.length - 1}
            valueMin={filters.colourMin}
            valueMax={filters.colourMax}
            onChange={(lo, hi) => patch({ colourMin: lo, colourMax: hi })}
            formatValue={(v) => COLOUR_SCALE[v]}
            ticks={COLOUR_SCALE}
          />
        </Field>

        <Field label="Clarity">
          <RangeSlider
            min={0}
            max={CLARITY_SCALE.length - 1}
            valueMin={filters.clarityMin}
            valueMax={filters.clarityMax}
            onChange={(lo, hi) => patch({ clarityMin: lo, clarityMax: hi })}
            formatValue={(v) => CLARITY_SCALE[v]}
            ticks={CLARITY_SCALE}
          />
        </Field>

        <div className="flex items-end">
          <button
            onClick={resetAll}
            className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-luxe text-champagne-deep hover:text-noir"
          >
            <RotateCcw className="h-4 w-4" /> Reset filters
          </button>
        </div>
      </div>

      {/* Results table */}
      <div className="overflow-hidden rounded-lg border border-ink/10">
        <div className="hidden grid-cols-12 items-center gap-2 border-b border-ink/10 bg-noir px-5 py-3 text-[11px] font-semibold uppercase tracking-luxe text-ivory md:grid">
          <span className="col-span-3">Shape</span>
          {COLUMNS.map((c) => (
            <button
              key={c.key}
              onClick={() => setSortFromHeader(c.key)}
              className={cn(
                'col-span-2 flex items-center gap-1 hover:text-glacier-soft',
                c.className === 'text-right' && 'justify-end'
              )}
            >
              {c.label}
              <SortCaret active={isActiveCol(sort, c.key)} dir={sort} colKey={c.key} />
            </button>
          ))}
          <span className="col-span-1" />
        </div>

        {results.length === 0 ? (
          <div className="px-5 py-16 text-center text-sm text-ink/50">
            No diamonds match these filters. Try widening your range.
          </div>
        ) : (
          <ul>
            {results.map((d) => (
              <li key={d.id}>
                <DiamondRow d={d} onSelect={onSelect} selectLabel={selectLabel} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DiamondRow({
  d,
  onSelect,
  selectLabel,
}: {
  d: Diamond;
  onSelect?: (d: Diamond) => void;
  selectLabel: string;
}) {
  const content = (
    <div className="grid w-full grid-cols-2 items-center gap-2 border-b border-ink/10 px-5 py-4 text-left text-sm transition hover:bg-glacier-soft/40 md:grid-cols-12">
      <span className="col-span-2 flex items-center gap-3 md:col-span-3">
        <DiamondShapeSvg shape={d.shape} size={30} className="text-glacier-deep" />
        <span className="font-medium text-noir">{DIAMOND_SHAPE_LABELS[d.shape].replace(' Brilliant', '')}</span>
      </span>
      <span className="col-span-1 md:col-span-2">
        <Cell label="Carat">{d.carat.toFixed(2)}</Cell>
      </span>
      <span className="col-span-1 md:col-span-2">
        <Cell label="Cut">{d.cut}</Cell>
      </span>
      <span className="col-span-1 md:col-span-2">
        <Cell label="Color">{d.colour}</Cell>
      </span>
      <span className="col-span-1 md:col-span-2">
        <Cell label="Clarity">{d.clarity}</Cell>
      </span>
      <span className="col-span-2 text-right font-semibold text-noir md:col-span-1">
        {formatMoney(d.price)}
      </span>
    </div>
  );

  if (onSelect) {
    return (
      <button onClick={() => onSelect(d)} className="block w-full">
        {content}
      </button>
    );
  }
  return (
    <Link href={`/diamonds/${d.id}`} className="block w-full">
      {content}
    </Link>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex flex-col font-medium text-ink md:block">
      <span className="text-[10px] font-semibold uppercase tracking-luxe text-ink/40 md:hidden">
        {label}
      </span>
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-luxe text-ink/50">
        {label}
      </div>
      {children}
    </div>
  );
}

function isActiveCol(sort: SortKey, key: SortKey) {
  if (key === 'price-asc') return sort === 'price-asc' || sort === 'price-desc';
  if (key === 'carat-desc') return sort === 'carat-asc' || sort === 'carat-desc';
  return sort === key;
}

function SortCaret({ active, dir, colKey }: { active: boolean; dir: SortKey; colKey: SortKey }) {
  if (!active) return <ChevronDown className="h-3 w-3 opacity-30" />;
  const isAsc = dir.endsWith('asc');
  return isAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
}
