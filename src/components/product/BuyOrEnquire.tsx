'use client';

import { useState } from 'react';
import { Check, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { useCart } from '@/lib/store/cart';
import { METAL_LABELS, METAL_SWATCH, type Product, type Metal } from '@/types';
import { formatMoney, cn } from '@/lib/utils';

export function BuyOrEnquire({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [metal, setMetal] = useState<Metal>(product.art.metal);
  const [added, setAdded] = useState(false);
  const [enquire, setEnquire] = useState(false);

  const buyable = product.purchase.mode === 'buyable' && product.purchase.price;

  const onAdd = () => {
    if (!product.purchase.price) return;
    add({
      id: `${product.id}-${metal}`,
      name: product.name,
      href: `/product/${product.slug}`,
      price: product.purchase.price,
      meta: METAL_LABELS[metal],
      art: { ...product.art, metal },
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Metal chips */}
      <div className="flex items-center gap-2.5">
        {product.metals.map((m) => {
          const s = METAL_SWATCH[m];
          return (
            <button
              key={m}
              aria-label={METAL_LABELS[m]}
              title={METAL_LABELS[m]}
              onClick={() => setMetal(m)}
              className={cn(
                'h-8 w-8 rounded-full border transition',
                metal === m ? 'border-noir ring-1 ring-noir ring-offset-2 ring-offset-ivory' : 'border-ink/20 hover:border-ink'
              )}
              style={{ background: `linear-gradient(135deg, ${s.light}, ${s.base} 55%, ${s.deep})` }}
            />
          );
        })}
        <span className="ml-1 text-[11px] uppercase tracking-luxe text-ink/50">{METAL_LABELS[metal]}</span>
      </div>

      {buyable ? (
        <>
          <Button onClick={onAdd} variant="primary" size="lg" className="w-full">
            {added ? (
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" /> Added to Bag</span>
            ) : (
              'Add to Bag'
            )}
          </Button>
          {product.purchase.financingEligible && product.purchase.price && (
            <p className="text-center text-[12px] font-light text-ink/55">
              or from {formatMoney({ amount: Math.round(product.purchase.price.amount / 12), currency: product.purchase.price.currency })}/mo with finance
            </p>
          )}
          <button
            onClick={() => setEnquire(true)}
            className="text-center text-[11px] uppercase tracking-luxe text-ink/55 underline-offset-4 hover:text-ink hover:underline"
          >
            Questions? Ask our concierge
          </button>
        </>
      ) : (
        <>
          <Button onClick={() => setEnquire(true)} variant="gold" size="lg" className="w-full">
            Request a Quote
          </Button>
          <Button href="/appointments" variant="outline" size="lg" className="w-full">
            <CalendarDays className="h-4 w-4" /> Book a Private Viewing
          </Button>
          <p className="text-center text-[12px] font-light text-ink/55">
            Made to order around the diamond of your choice
            {product.purchase.leadTimeDays ? ` · approx. ${product.purchase.leadTimeDays} days` : ''}
          </p>
        </>
      )}

      <EnquiryModal
        open={enquire}
        onClose={() => setEnquire(false)}
        context={`${product.name} (${product.slug}) — ${METAL_LABELS[metal]}`}
        intro={`Enquiring about the ${product.name}. Tell us your preferred carat, size or any questions.`}
      />
    </div>
  );
}
