'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, ShieldCheck, Truck, AlertTriangle } from 'lucide-react';
import { useCart, type CartItem } from '@/lib/store/cart';
import { JewelArt }       from '@/components/art/JewelArt';
import { Button }         from '@/components/ui/Button';
import { EnquiryModal }   from '@/components/enquiry/EnquiryModal';
import { formatMoney }    from '@/lib/utils';
import { trackEvent }     from '@/lib/analytics';
import { buildOfferDescription, clarityLabel, cutLabel } from '@/lib/earrings/cart-helpers';

export default function CartPage() {
  const { items, remove, setQty, cartToken } = useCart();
  const [mounted,      setMounted]      = useState(false);
  const [checkout,     setCheckout]     = useState(false);
  // Track which earring cart lines are expired (by item ID)
  const [expiredLines, setExpiredLines] = useState<Set<string>>(new Set());
  useEffect(() => setMounted(true), []);

  // Earring offers are completed-pair specifications with no physical hold —
  // they do not expire, so no cart-line revalidation is required on mount.

  const list = mounted ? items : [];
  const subtotal = {
    amount:   list.reduce((s, i) => s + i.price.amount * i.qty, 0),
    currency: list[0]?.price.currency ?? ('GBP' as const),
  };

  const firstConfiguredRing    = list.find(i => i.ringConfig)?.ringConfig;
  const firstConfiguredEarring = list.find(i => i.earringConfig && !expiredLines.has(i.id))?.earringConfig;

  function handleRemove(item: CartItem) {
    if (item.ringConfig) {
      fetch('/api/rings/release', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ diamondId: item.ringConfig.diamondId, cartToken }),
      }).catch(console.error);
      trackEvent('engagement_ring_removed_from_bag', {
        settingId: item.ringConfig.settingId,
        diamondId: item.ringConfig.diamondId,
      });
    }
    // Earring offers are not physically reserved — nothing to release.
    remove(item.id);
  }

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
          <Button href="/build-a-ring" variant="outline" size="md">Design Your Own</Button>
        </div>
      </div>
    );
  }

  const hasBlockingExpiry = expiredLines.size > 0;

  return (
    <div className="container-luxe py-14 md:py-20">
      <h1 className="mb-10 font-display text-4xl font-light md:text-5xl">Your Selection</h1>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* items */}
        <div className="lg:col-span-2">
          {list.map((item) =>
            item.ringConfig ? (
              /* ── Configured engagement ring ── */
              <div key={item.id} className="flex gap-5 border-b border-ink/10 py-6">
                <Link href={item.href} className="h-32 shrink-0 overflow-hidden bg-ivory-deep" style={{ width: '6.5rem' }}>
                  <JewelArt art={item.art} gid={`cartpage-${item.id}`} className="h-full w-full" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={item.href} className="font-display text-2xl leading-tight hover:text-champagne-deep">
                    {item.name}
                  </Link>
                  <span className="mt-1 text-xs font-light text-ink/50">
                    {item.ringConfig.diamondDescription}
                  </span>
                  <span className="mt-0.5 text-xs font-light text-ink/50">
                    {item.ringConfig.metalLabel}
                    {item.ringConfig.ringSize ? ` · Size ${item.ringConfig.ringSize}` : ''}
                  </span>
                  <dl className="mt-3 flex flex-col gap-1 text-xs font-light text-ink/60">
                    <div className="flex justify-between"><dt>Setting</dt><dd>{formatMoney({ amount: item.ringConfig.settingPrice, currency: 'GBP' })}</dd></div>
                    <div className="flex justify-between"><dt>Diamond</dt><dd>{formatMoney({ amount: item.ringConfig.diamondPrice, currency: 'GBP' })}</dd></div>
                    <div className="flex justify-between border-t border-ink/10 pt-1 text-sm font-normal text-ink/80"><dt>Total</dt><dd>{formatMoney(item.price)}</dd></div>
                  </dl>
                  <div className="mt-auto flex justify-end pt-4">
                    <button className="text-[10px] uppercase tracking-luxe text-ink/40 hover:text-ink" onClick={() => handleRemove(item)}>Remove</button>
                  </div>
                </div>
              </div>
            ) : item.earringConfig ? (
              /* ── Configured earring ── */
              <div key={item.id} className={`flex gap-5 border-b border-ink/10 py-6 ${expiredLines.has(item.id) ? 'opacity-70' : ''}`}>
                <Link href={item.href} className="h-32 shrink-0 overflow-hidden bg-ivory-deep" style={{ width: '6.5rem' }}>
                  <JewelArt art={item.art} gid={`cartpage-${item.id}`} className="h-full w-full" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <Link href={item.href} className="font-display text-2xl leading-tight hover:text-champagne-deep">
                    {item.name}
                  </Link>
                  <span className="mt-1 text-xs font-light text-ink/50">{item.earringConfig.metalLabel}</span>
                  <span className="mt-0.5 text-xs font-light text-ink/50">
                    Matched diamond pair · {cutLabel(item.earringConfig.cut)}
                  </span>
                  <span className="mt-0.5 text-xs font-light text-ink/50">
                    {item.earringConfig.totalCarat.toFixed(2)}ct total · {item.earringConfig.colour} Colour · {clarityLabel(item.earringConfig.clarity)} Clarity
                  </span>
                  {item.earringConfig.availability === 'made_to_order' && (
                    <span className="mt-0.5 text-[10px] uppercase tracking-luxe text-champagne-deep">Available to order</span>
                  )}
                  <dl className="mt-3 flex flex-col gap-1 text-xs font-light text-ink/60">
                    <div className="flex justify-between border-t border-ink/10 pt-1 text-sm font-normal text-ink/80">
                      <dt>Total</dt>
                      <dd>{formatMoney(item.price)}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    {expiredLines.has(item.id) ? (
                      <Link href={item.href} className="text-[10px] uppercase tracking-luxe text-amber-700 hover:text-amber-900">
                        Review selection →
                      </Link>
                    ) : <span />}
                    <button className="text-[10px] uppercase tracking-luxe text-ink/40 hover:text-ink" onClick={() => handleRemove(item)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Standard item ── */
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
                    <button className="text-[10px] uppercase tracking-luxe text-ink/40 hover:text-ink" onClick={() => handleRemove(item)}>Remove</button>
                  </div>
                </div>
              </div>
            )
          )}
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
            <Button
              onClick={() => {
                if (firstConfiguredRing) {
                  trackEvent('engagement_enquiry_with_ring_config', {
                    settingId:  firstConfiguredRing.settingId,
                    diamondId:  firstConfiguredRing.diamondId,
                    totalPrice: firstConfiguredRing.totalPrice / 100,
                  });
                }
                if (firstConfiguredEarring) {
                  trackEvent('earring_enquiry_with_config', {
                    productId:  firstConfiguredEarring.productId,
                    totalPrice: firstConfiguredEarring.totalPrice / 100,
                  });
                }
                setCheckout(true);
              }}
              variant="primary"
              size="lg"
              className="mt-6 w-full"
              disabled={hasBlockingExpiry}
            >
              Complete Your Order
            </Button>
            {hasBlockingExpiry && (
              <p className="mt-2 text-center text-[11px] text-amber-700">
                Please review or remove expired selections before continuing.
              </p>
            )}
            {!hasBlockingExpiry && (
              <p className="mt-3 text-center text-[11px] font-light text-ink/45">Taxes calculated at checkout</p>
            )}
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
        context={`Order: ${list.map(i => `${i.name} ×${i.qty}`).join('; ')} — total ${formatMoney(subtotal)}`}
        ringConfig={firstConfiguredRing}
        earringConfig={firstConfiguredEarring}
        cartToken={firstConfiguredRing || firstConfiguredEarring ? cartToken : undefined}
      />
    </div>
  );
}
