'use client';

import { useMemo, useState } from 'react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { METAL_LABELS, type Metal } from '@/types/common';
import type { Product } from '@/types/product';
import { cn } from '@/lib/utils';

type SortKey = 'featured' | 'price-asc' | 'price-desc';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
];

const METALS: Metal[] = ['platinum', 'white-gold', 'yellow-gold', 'rose-gold'];

function priceOf(p: Product): number {
  return p.purchase.price?.amount ?? Number.MAX_SAFE_INTEGER;
}

export function CategoryView({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>('featured');
  const [metal, setMetal] = useState<Metal | null>(null);
  const [buyableOnly, setBuyableOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];
    if (metal) list = list.filter((p) => p.metals.includes(metal));
    if (buyableOnly) list = list.filter((p) => p.purchase.mode === 'buyable');
    if (sort === 'price-asc') list.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === 'price-desc') list.sort((a, b) => priceOf(b) - priceOf(a));
    else list.sort((a, b) => Number(b.featured ?? 0) - Number(a.featured ?? 0));
    return list;
  }, [products, metal, buyableOnly, sort]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-y border-ink/10 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMetal(null)}
            className={cn(
              'border px-4 py-2 text-xs uppercase tracking-luxe transition',
              metal === null ? 'border-ink bg-ink text-ivory' : 'border-ink/20 hover:border-ink'
            )}
          >
            All Metals
          </button>
          {METALS.map((m) => (
            <button
              key={m}
              onClick={() => setMetal(m)}
              className={cn(
                'border px-4 py-2 text-xs uppercase tracking-luxe transition',
                metal === m ? 'border-ink bg-ink text-ivory' : 'border-ink/20 hover:border-ink'
              )}
            >
              {METAL_LABELS[m]}
            </button>
          ))}
          <label className="ml-2 flex cursor-pointer items-center gap-2 text-xs uppercase tracking-luxe text-ink/70">
            <input
              type="checkbox"
              checked={buyableOnly}
              onChange={(e) => setBuyableOnly(e.target.checked)}
              className="accent-champagne"
            />
            Shop online
          </label>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="border border-ink/20 bg-transparent px-4 py-2 text-xs uppercase tracking-luxe text-ink focus:border-champagne focus:outline-none"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <ProductGrid products={filtered} />
    </div>
  );
}
