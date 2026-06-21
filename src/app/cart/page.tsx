'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/lib/store/cart';
import { JewelArt } from '@/components/art/JewelArt';
import { Button } from '@/components/ui/Button';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { formatMoney } from '@/lib/utils';

export default function CartPage() {
  const { items, remove, setQty } = useCart();
  const [mounted, setMounted] = useState(false);
  const [checkout, setCheckout] = useState(false);
  useEffect(() => setMounted(true), []);

  const list = mounted ? items : [];
  const subtotal = {
    amount: list.reduce((s, i) => s + i.price.amount * i.qty, 0),
    currency: list[0]?.price.currency ?? ('GBP' as const),
  };

  if (mounted && list.length === 0) {
    return (
      <div className="container-luxe flex min-h-[50vh] flex-col items-center justify-center gap-6 py-24 text-center">
        <ShoppingBag className="h-10 w-10 text-ink/25" strokeWidth={1} />
        <h1 className="font-display text-4xl font-light">Your selection is empty</h1>
        <p className="max-w-sm font-light text-ink/55">
          Explore our collections, or design something entirely your own.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href="/engagement-rings" variant="primary" size="md">Explore Jewellery</Button>
          <Button href="/builder" variant="outline" size="md">Design Your Own</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-luxe py-14 md:py-20">
      <h1 className="mb-10 font-display text-4xl font-light md:text-5xl">Your Selection</h1>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* items */}
        <div className="lg:col-span-2">
          {list.map((item) => (
            <div key={item.id} className="flex gap-5 border-b border-ink/10 py-6">
              <Link href={item.href} className="h-32 shrink-0 overflow-hidden bg-ivory-deep" style={{ width: '6.5rem' }}>
                <JewelArt art={item.art} gid={`cartpage-${item.id}`} className="h-full w-full" />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link href={item.href} className="font-display text-2xl leading-tight hover:text-champagne-deep">{item.name}</Link>
                {item.meta && <span className="mt-1 text-xs font-light text-ink/50">{item.meta}</span>}
                <span className="mt-2 text-ink/80">{formatMoney(item.price)}</span>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <div className="flex items-center border border-ink/20">
                    <button aria-label="Decrease" className="px-3 py-2 hover:text-champagne-deep" onClick={() => setQty(item.id, item.qty - 1)}><Minus className="h-3 w-3" /></button>
                    <span className="min-w-8 text-center text-sm">{item.qty}</span>
                    <button aria-label="Increase" className="px-3 py-2 hover:text-champagne-deep" onClick={() => setQty(item.id, item.qty + 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                  <button className="text-[10px] uppercase tracking-luxe text-ink/40 hover:text-ink" onClick={() => remove(item.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* summary */}
        <aside className="lg:sticky lg:top-40 lg:self-start">
          <div className="border border-ink/10 p-7">
            <h2 className="font-display text-2xl">Order Summary</h2>
            <dl className="mt-5 flex flex-col gap-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink/55">Subtotal</dt><dd>{formatMoney(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/55">Delivery</dt><dd className="text-champagne-deep">Complimentary</dd></div>
              <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-4">
                <dt className="font-display text-xl">Total</dt>
                <dd className="font-display text-2xl">{formatMoney(subtotal)}</dd>
              </div>
            </dl>
            <Button onClick={() => setCheckout(true)} variant="primary" size="lg" className="mt-6 w-full">Complete Your Order</Button>
            <p className="mt-3 text-center text-[11px] font-light text-ink/45">Taxes calculated at checkout</p>
            <ul className="mt-6 flex flex-col gap-3 border-t border-ink/10 pt-5 text-[12px] font-light text-ink/60">
              <li className="flex items-center gap-2.5"><Truck className="h-4 w-4 text-champagne-deep" /> Insured, signature delivery</li>
              <li className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-champagne-deep" /> Lifetime guarantee & 30-day returns</li>
            </ul>
          </div>
        </aside>
      </div>

      <EnquiryModal
        open={checkout}
        onClose={() => setCheckout(false)}
        title="Complete Your Order"
        intro="A concierge will confirm availability, sizing and secure payment for your selection — usually within one business day."
        context={`Order: ${list.map((i) => `${i.name} ×${i.qty}`).join('; ')} — total ${formatMoney(subtotal)}`}
      />
    </div>
  );
}
