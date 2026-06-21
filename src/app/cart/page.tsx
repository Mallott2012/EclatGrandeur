'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import { useCart, cartTotal } from '@/lib/commerce/cart';
import { formatMoney } from '@/lib/utils';

export default function CartPage() {
  const { items, remove, setQuantity } = useCart();
  const total = cartTotal(items);

  if (items.length === 0) {
    return (
      <div className="container-luxe py-28 text-center">
        <h1 className="font-display text-4xl font-light text-ink">Your Bag is Empty</h1>
        <p className="mt-4 font-light text-ink/65">
          Discover diamonds worthy of a lifetime.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/jewellery/necklaces"
            className="bg-ink px-7 py-4 text-xs uppercase tracking-luxe text-ivory hover:bg-ink-soft"
          >
            Explore Jewellery
          </Link>
          <Link
            href="/engagement-rings/builder"
            className="border border-ink/30 px-7 py-4 text-xs uppercase tracking-luxe hover:border-ink"
          >
            Create Your Own
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-luxe py-16">
      <h1 className="mb-12 font-display text-4xl font-light text-ink">Your Bag</h1>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="flex flex-col divide-y divide-ink/10">
            {items.map((item) => (
              <li key={item.id} className="flex gap-6 py-6">
                <div className="relative h-32 w-28 shrink-0 overflow-hidden bg-ivory-deep">
                  <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col">
                  <p className="font-display text-xl text-ink">{item.name}</p>
                  {item.meta && <p className="text-sm font-light text-ink/55">{item.meta}</p>}
                  <p className="mt-1 text-sm text-ink">{formatMoney(item.price)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-ink/20">
                      <button className="px-3 py-2" onClick={() => setQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-4 text-sm">{item.quantity}</span>
                      <button className="px-3 py-2" onClick={() => setQuantity(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      className="text-xs uppercase tracking-luxe text-ink/50 hover:text-ink"
                      onClick={() => remove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit border border-ink/10 p-8">
          <h2 className="font-display text-2xl text-ink">Summary</h2>
          <div className="mt-6 flex flex-col gap-3 text-sm font-light">
            <div className="flex justify-between text-ink/70">
              <span>Subtotal</span>
              <span>{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>Delivery</span>
              <span>Complimentary</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-4">
              <span className="text-xs uppercase tracking-luxe text-ink">Total</span>
              <span className="font-display text-2xl text-ink">{formatMoney(total)}</span>
            </div>
          </div>
          <button
            disabled
            className="mt-6 w-full cursor-not-allowed bg-ink/80 px-7 py-4 text-xs uppercase tracking-luxe text-ivory"
            title="Secure checkout arrives in Phase 2"
          >
            Proceed to Checkout
          </button>
          <p className="mt-3 text-center text-xs font-light text-ink/55">
            Secure checkout with instalment options coming soon. For immediate purchase,{' '}
            <Link href="/appointments" className="underline">
              contact our concierge
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
