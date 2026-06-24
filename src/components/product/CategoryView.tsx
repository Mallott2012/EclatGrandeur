'use client';

import { useMemo, useState } from 'react';
import { ProductGrid } from './ProductGrid';
import { METAL_LABELS, type Metal, type Product } from '@/types';
import { cn } from '@/lib/utils';
import { SlidersHorizontal } from 'lucide-react';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'new';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'new', label: 'New In' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
];

const METALS: Metal[] = ['platinum', 'white-gold', 'yellow-gold', 'rose-gold'];

const priceOf = (p: Product) => p.purchase.price?.amount ?? Number.MAX_SAFE_INTEGER;

export function CategoryView({ products, gidPrefix }: { products: Product[]; gidPrefix?: string }) {
  const [sort, setSort] = useState<SortKey>('featured');
  const [metal, setMetal] = useState<Metal | null>(null);
  const [buyableOnly, setBuyableOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];
    if (metal) list = list.filter((p) => p.metals.includes(metal));
    if (buyableOnly) list = list.filter((p) => p.purchase.mode === 'buyable');
    if (sort === 'price-asc') list.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === 'price-desc') list.sort((a, b) => priceOf(b) - priceOf(a));
    else if (sort === 'new') list.sort((a, b) => Number(b.isNew ?? 0) - Number(a.isNew ?? 0));
    else list.sort((a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0));
    return list;
  }, [products, metal, buyableOnly, sort]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 border-y border-ink/10 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden items-center gap-2 text-[11px] uppercase tracking-luxe text-ink/50 sm:flex">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Metal
          </span>
          <Chip active={metal === null} onClick={() => setMetal(null)}>All</Chip>
          {METALS.map((m) => (
            <Chip key={m} active={metal === m} onClick={() => setMetal(m)}>
              {METAL_LABELS[m]}
            </Chip>
          ))}
          <label className="ml-2 flex cursor-pointer items-center gap-2 text-[11px] uppercase tracking-luxe text-ink/60">
            <input
              type="checkbox"
              checked={buyableOnly}
              onChange={(e) => setBuyableOnly(e.target.checked)}
              className="accent-champagne"
            />
            Shop online
          </label>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-luxe text-ink/40">{filtered.length} pieces</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-ink/20 bg-transparent px-4 py-2 text-[11px] uppercase tracking-luxe text-ink focus:border-champagne focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <ProductGrid products={filtered} gidPrefix={gidPrefix ?? 'cat'} />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'border px-4 py-2 text-[11px] uppercase tracking-luxe transition',
        active ? 'border-noir bg-noir text-ivory' : 'border-ink/20 text-ink hover:border-ink'
      )}
    >
      {children}
    </button>
  );
}
