'use client';

import Link from 'next/link';
import { useBuilder } from '@/lib/builder/store';
import { getDiamondBySku, getSettingBySlug } from '@/lib/data/diamonds';
import { computeRingPrice } from '@/lib/builder/pricing';
import { JewelViewer } from '@/components/product/JewelViewer';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import { useCart } from '@/lib/commerce/cart';
import { BUYABLE_THRESHOLD } from '@/config/site';
import {
  DIAMOND_SHAPE_LABELS,
  METAL_LABELS,
  type Metal,
} from '@/types/common';
import { formatMoney, cn } from '@/lib/utils';

const RING_SIZES = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

export default function ReviewStep() {
  const { settingSlug, diamondSku, metal, ringSize, setMetal, setRingSize } =
    useBuilder();
  const add = useCart((s) => s.add);

  const setting = settingSlug ? getSettingBySlug(settingSlug) : undefined;
  const diamond = diamondSku ? getDiamondBySku(diamondSku) : undefined;

  if (!setting || !diamond) {
    return (
      <div className="container-luxe py-24 text-center">
        <h1 className="font-display text-3xl text-ink">Your creation is incomplete</h1>
        <p className="mt-3 text-sm font-light text-ink/65">
          Please choose both a setting and a diamond to review your ring.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/engagement-rings/builder/setting"
            className="border border-ink/30 px-6 py-3 text-xs uppercase tracking-luxe hover:border-ink"
          >
            Choose Setting
          </Link>
          <Link
            href="/engagement-rings/builder/diamond"
            className="border border-ink/30 px-6 py-3 text-xs uppercase tracking-luxe hover:border-ink"
          >
            Choose Diamond
          </Link>
        </div>
      </div>
    );
  }

  const metalsAvailable = setting.metals;
  const activeMetal: Metal = metalsAvailable.includes(metal)
    ? metal
    : metalsAvailable[0];
  const total = computeRingPrice(setting, diamond, activeMetal);
  const canBuyOnline = total.amount <= BUYABLE_THRESHOLD;

  const previewImage = {
    src: setting.images[0].src,
    alt: `${setting.name} with ${DIAMOND_SHAPE_LABELS[diamond.shape]} diamond`,
  };

  return (
    <div className="container-luxe py-14">
      <div className="mb-10 text-center">
        <span className="eyebrow">Step Three</span>
        <h1 className="mt-3 font-display text-4xl font-light text-ink">Your Creation</h1>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Live 3D preview */}
        <div>
          <JewelViewer
            model={setting.model3d}
            fallbackImage={previewImage}
            metal={activeMetal}
          />
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-3xl text-ink">{setting.name}</h2>
            <p className="text-sm font-light text-ink/65">
              with a {diamond.carat.toFixed(2)}ct {DIAMOND_SHAPE_LABELS[diamond.shape]}{' '}
              diamond
            </p>
          </div>

          {/* Metal */}
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-luxe text-ink/60">
              Metal · {METAL_LABELS[activeMetal]}
            </span>
            <div className="flex flex-wrap gap-2">
              {metalsAvailable.map((m) => (
                <button
                  key={m}
                  onClick={() => setMetal(m)}
                  className={cn(
                    'border px-4 py-2 text-xs uppercase tracking-luxe transition',
                    activeMetal === m
                      ? 'border-ink bg-ink text-ivory'
                      : 'border-ink/20 hover:border-ink'
                  )}
                >
                  {METAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Ring size */}
          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-luxe text-ink/60">
              Ring Size {ringSize ? `· ${ringSize}` : ''}
            </span>
            <div className="flex flex-wrap gap-2">
              {RING_SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setRingSize(s)}
                  className={cn(
                    'h-10 w-10 border text-xs transition',
                    ringSize === s
                      ? 'border-ink bg-ink text-ivory'
                      : 'border-ink/20 hover:border-ink'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="flex flex-col gap-2 border-y border-ink/10 py-5 text-sm font-light">
            <div className="flex justify-between text-ink/70">
              <span>Setting ({METAL_LABELS[activeMetal]})</span>
              <span>
                {formatMoney({
                  amount:
                    setting.basePrice.amount +
                    (setting.metalPriceDelta?.[activeMetal] ?? 0),
                  currency: setting.basePrice.currency,
                })}
              </span>
            </div>
            <div className="flex justify-between text-ink/70">
              <span>
                Diamond ({diamond.carat.toFixed(2)}ct {diamond.color} {diamond.clarity})
              </span>
              <span>{formatMoney(diamond.price)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between border-t border-ink/10 pt-3">
              <span className="text-xs uppercase tracking-luxe text-ink">Total</span>
              <span className="font-display text-3xl text-ink">{formatMoney(total)}</span>
            </div>
          </div>

          {/* CTA */}
          {canBuyOnline ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() =>
                  add({
                    id: `${setting.slug}-${diamond.sku}-${activeMetal}`,
                    slug: 'engagement-rings/builder',
                    name: `${setting.name} · ${diamond.carat.toFixed(2)}ct ${DIAMOND_SHAPE_LABELS[diamond.shape]}`,
                    category: 'engagement-rings',
                    image: previewImage.src,
                    price: total,
                    meta: `${METAL_LABELS[activeMetal]}${ringSize ? `, size ${ringSize}` : ''}`,
                  })
                }
                className="w-full bg-ink px-7 py-4 text-xs uppercase tracking-luxe text-ivory transition hover:bg-ink-soft"
              >
                Add to Bag — {formatMoney(total)}
              </button>
              <p className="text-center text-xs font-light text-ink/55">
                or 12 interest-free instalments of{' '}
                {formatMoney({
                  amount: Math.round(total.amount / 12),
                  currency: total.currency,
                })}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <EnquiryModal
                triggerLabel="Request a Quote"
                title="Reserve Your Creation"
                subtitle="This bespoke ring is created to order. Share your details and a specialist will guide you through the final steps."
                type="bespoke"
                source="builder"
                builtRing={{
                  settingSlug: setting.slug,
                  diamondSku: diamond.sku,
                  metal: activeMetal,
                }}
              />
              <p className="text-center text-xs font-light text-ink/55">
                Made to order · estimated 4–6 weeks
              </p>
            </div>
          )}

          <Link
            href="/engagement-rings/builder/diamond"
            className="text-center text-xs uppercase tracking-luxe text-ink/60 underline-offset-4 hover:text-ink hover:underline"
          >
            Change diamond
          </Link>
        </div>
      </div>
    </div>
  );
}
