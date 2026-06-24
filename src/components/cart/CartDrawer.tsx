'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/store/cart';
import { JewelArt } from '@/components/art/JewelArt';
import { Button } from '@/components/ui/Button';
import { formatMoney } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const { items, open, setOpen, remove, setQty } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const list = mounted ? items : [];
  const subtotal = {
    amount: list.reduce((s, i) => s + i.price.amount * i.qty, 0),
    currency: list[0]?.price.currency ?? ('GBP' as const),
  };

  return (
    <div
      className={cn('fixed inset-0 z-[80]', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      <div
        className={cn('absolute inset-0 bg-noir/50 backdrop-blur-sm transition-opacity duration-500', open ? 'opacity-100' : 'opacity-0')}
        onClick={() => setOpen(false)}
      />
      <aside
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-ivory shadow-luxe transition-transform duration-500 ease-luxe',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Shopping bag"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-display text-2xl">Your Selection</h2>
          <button aria-label="Close" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" strokeWidth={1.25} />
          </button>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <ShoppingBag className="h-9 w-9 text-ink/30" strokeWidth={1} />
            <p className="font-light text-ink/60">Your selection is empty.</p>
            <Button href="/engagement-rings" variant="outline" size="sm" >
              Begin Exploring
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {list.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-ink/10 py-5">
                  <Link href={item.href} onClick={() => setOpen(false)} className="h-24 w-20 shrink-0 overflow-hidden bg-ivory-deep">
                    <JewelArt art={item.art} gid={`cart-${item.id}`} className="h-full w-full" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link href={item.href} onClick={() => setOpen(false)} className="font-display text-lg leading-tight hover:text-champagne-deep">
                      {item.name}
                    </Link>
                    {item.meta && <span className="mt-0.5 text-xs font-light text-ink/50">{item.meta}</span>}
                    <span className="mt-1 text-sm text-ink/80">{formatMoney(item.price)}</span>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center border border-ink/20">
                        <button aria-label="Decrease" className="px-2 py-1.5 hover:text-champagne-deep" onClick={() => setQty(item.id, item.qty - 1)}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-7 text-center text-xs">{item.qty}</span>
                        <button aria-label="Increase" className="px-2 py-1.5 hover:text-champagne-deep" onClick={() => setQty(item.id, item.qty + 1)}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button className="text-[10px] uppercase tracking-luxe text-ink/40 hover:text-ink" onClick={() => remove(item.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink/10 px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-luxe text-ink/60">Subtotal</span>
                <span className="font-display text-2xl">{formatMoney(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] font-light text-ink/50">
                Insured delivery & gift presentation included. Taxes at checkout.
              </p>
              <Button href="/cart" variant="primary" size="lg" className="mt-4 w-full">
                Proceed to Checkout
              </Button>
              <button onClick={() => setOpen(false)} className="mt-3 w-full text-center text-[11px] uppercase tracking-luxe text-ink/50 hover:text-ink">
                Continue Exploring
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
