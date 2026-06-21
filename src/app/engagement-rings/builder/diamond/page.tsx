'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useBuilder } from '@/lib/builder/store';
import { getDiamonds, getSettingBySlug } from '@/lib/data/diamonds';
import { compatibleDiamonds } from '@/lib/builder/compatibility';
import { DIAMOND_SHAPE_LABELS, type DiamondShape } from '@/types/common';
import type { Diamond } from '@/types/diamond';
import { formatMoney, cn } from '@/lib/utils';

type SortKey = 'price-asc' | 'price-desc' | 'carat-desc';

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
      settingSlug
        ? '/engagement-rings/builder/review'
        : '/engagement-rings/builder/setting'
    );
  };

  return (
    <div className="container-luxe py-14">
      <div className="mb-10 text-center">
        <span className="eyebrow">Step Two</span>
        <h1 className="mt-3 font-display text-4xl font-light text-ink">Choose Your Diamond</h1>
        {setting && (
          <p className="mt-2 text-sm font-light text-ink/60">
            Showing diamonds compatible with the {setting.name} setting.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 border-y border-ink/10 py-5">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={shape === null} onClick={() => setShape(null)}>
            All Shapes
          </FilterChip>
          {shapes.map((s) => (
            <FilterChip key={s} active={shape === s} onClick={() => setShape(s)}>
              {DIAMOND_SHAPE_LABELS[s]}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {(['all', 'natural', 'lab-grown'] as const).map((t) => (
              <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
                {t === 'all' ? 'All' : t === 'natural' ? 'Natural' : 'Lab-Grown'}
              </FilterChip>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-ink/20 bg-transparent px-4 py-2 text-xs uppercase tracking-luxe text-ink focus:border-champagne focus:outline-none"
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="carat-desc">Carat: High to Low</option>
          </select>
        </div>
      </div>

      {!setting && (
        <p className="mb-6 text-center text-xs font-light text-ink/60">
          No setting chosen yet — you’ll pick one next.{' '}
          <Link href="/engagement-rings/builder/setting" className="underline">
            Choose a setting first
          </Link>
        </p>
      )}

      {/* Diamond table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/15 text-left text-[10px] uppercase tracking-luxe text-ink/50">
              <th className="py-3 pr-4 font-normal">Shape</th>
              <th className="py-3 pr-4 font-normal">Carat</th>
              <th className="py-3 pr-4 font-normal">Cut</th>
              <th className="py-3 pr-4 font-normal">Colour</th>
              <th className="py-3 pr-4 font-normal">Clarity</th>
              <th className="py-3 pr-4 font-normal">Cert</th>
              <th className="py-3 pr-4 font-normal">Price</th>
              <th className="py-3 font-normal" />
            </tr>
          </thead>
          <tbody>
            {diamonds.map((d) => (
              <tr
                key={d.id}
                className={cn(
                  'border-b border-ink/5 font-light transition hover:bg-ivory-deep/40',
                  diamondSku === d.sku && 'bg-champagne/10'
                )}
              >
                <td className="py-4 pr-4">{DIAMOND_SHAPE_LABELS[d.shape]}</td>
                <td className="py-4 pr-4">{d.carat.toFixed(2)}</td>
                <td className="py-4 pr-4">{d.cut}</td>
                <td className="py-4 pr-4">{d.color}</td>
                <td className="py-4 pr-4">{d.clarity}</td>
                <td className="py-4 pr-4 text-xs">{d.certification.authority}</td>
                <td className="py-4 pr-4">{formatMoney(d.price)}</td>
                <td className="py-4">
                  <button
                    onClick={() => choose(d)}
                    className="border border-ink/30 px-4 py-2 text-[10px] uppercase tracking-luxe text-ink transition hover:border-ink hover:bg-ink hover:text-ivory"
                  >
                    Select
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {diamonds.length === 0 && (
          <p className="py-12 text-center text-sm font-light text-ink/60">
            No diamonds match your selection.
          </p>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'border px-4 py-2 text-xs uppercase tracking-luxe transition',
        active ? 'border-ink bg-ink text-ivory' : 'border-ink/20 hover:border-ink'
      )}
    >
      {children}
    </button>
  );
}
