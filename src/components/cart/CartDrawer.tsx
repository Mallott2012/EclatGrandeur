'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, X } from 'lucide-react';
import { useCart, cartTotal } from '@/lib/commerce/cart';
import { formatMoney, cn } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, close, remove, setQuantity } = useCart();
  const total = cartTotal(items);

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70]',
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-ink/40 transition-opacity duration-500',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={close}
      />
      <aside
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory transition-transform duration-500 ease-luxe',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-ink/10 p-6">
          <h2 className="font-display text-2xl text-ink">Your Bag</h2>
          <button aria-label="Close bag" onClick={close}>
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-light text-ink/60">Your bag is empty.</p>
            <Link
              href="/jewellery/necklaces"
              onClick={close}
              className="text-xs uppercase tracking-luxe text-ink underline-offset-4 hover:underline"
            >
              Explore Jewellery
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6">
              <ul className="flex flex-col gap-6">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-ivory-deep">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="font-display text-lg leading-tight text-ink">
                        {item.name}
                      </p>
                      {item.meta && (
                        <p className="text-xs font-light text-ink/55">{item.meta}</p>
                      )}
                      <p className="mt-1 text-sm text-ink">{formatMoney(item.price)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-ink/20">
                          <button
                            aria-label="Decrease"
                            className="px-2 py-1"
                            onClick={() => setQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-sm">{item.quantity}</span>
                          <button
                            aria-label="Increase"
                            className="px-2 py-1"
                            onClick={() => setQuantity(item.id, item.quantity + 1)}
                          >
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

            <div className="border-t border-ink/10 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs uppercase tracking-luxe text-ink/60">Subtotal</span>
                <span className="font-display text-2xl text-ink">{formatMoney(total)}</span>
              </div>
              <Link
                href="/cart"
                onClick={close}
                className="block w-full bg-ink px-7 py-4 text-center text-xs uppercase tracking-luxe text-ivory hover:bg-ink-soft"
              >
                View Bag &amp; Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
