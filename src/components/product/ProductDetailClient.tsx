'use client';

import { useState } from 'react';
import { ProductMedia } from './ProductMedia';
import { BuyOrEnquire } from './BuyOrEnquire';
import { PriceBlock, FinancingNote } from './PriceBlock';
import type { Product } from '@/types/product';
import { METAL_LABELS, type Metal } from '@/types/common';
import { cn } from '@/lib/utils';

export function ProductDetailClient({ product }: { product: Product }) {
  const [metal, setMetal] = useState<Metal>(product.metals[0]);

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
      <ProductMedia product={product} metal={metal} />

      <div className="flex flex-col gap-6 lg:pt-6">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">{product.collectionSlugs[0] ?? 'Éclat Grandeur'}</span>
          <h1 className="font-display text-4xl font-light text-ink md:text-5xl">
            {product.name}
          </h1>
          <p className="text-base font-light leading-relaxed text-ink/70">
            {product.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 border-y border-ink/10 py-5">
          <PriceBlock purchase={product.purchase} />
          <FinancingNote purchase={product.purchase} />
        </div>

        {/* Metal selector */}
        {product.metals.length > 1 && (
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-luxe text-ink/60">
              Metal · {METAL_LABELS[metal]}
            </span>
            <div className="flex flex-wrap gap-2">
              {product.metals.map((m) => (
                <button
                  key={m}
                  onClick={() => setMetal(m)}
                  className={cn(
                    'border px-4 py-2 text-xs uppercase tracking-luxe transition',
                    metal === m
                      ? 'border-ink bg-ink text-ivory'
                      : 'border-ink/20 text-ink hover:border-ink'
                  )}
                >
                  {METAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        )}

        <BuyOrEnquire product={product} metal={metal} />

        {/* Details */}
        <div className="mt-2 flex flex-col gap-6 border-t border-ink/10 pt-6">
          <p className="text-sm font-light leading-relaxed text-ink/70">
            {product.details}
          </p>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-ink/5 py-2">
                <dt className="text-xs uppercase tracking-luxe text-ink/50">{k}</dt>
                <dd className="text-sm font-light text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {product.certification && (
            <p className="text-xs font-light text-ink/55">
              Accompanied by {product.certification.authority} certification.{' '}
              {product.certification.ethical?.traceable &&
                'Ethically sourced and fully traceable.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
