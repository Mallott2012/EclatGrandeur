'use client';

import Link from 'next/link';
import { useCart } from '@/lib/commerce/cart';
import { EnquiryModal } from '@/components/enquiry/EnquiryModal';
import type { Product } from '@/types/product';

export function BuyOrEnquire({
  product,
  metal,
}: {
  product: Product;
  metal?: string;
}) {
  const add = useCart((s) => s.add);

  if (product.purchase.mode === 'buyable' && product.purchase.price) {
    const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() =>
            add({
              id: metal ? `${product.slug}-${metal}` : product.slug,
              slug: product.slug,
              name: product.name,
              category: product.category,
              image: image.src,
              price: product.purchase.price!,
              meta: metal,
            })
          }
          className="w-full bg-ink px-7 py-4 text-xs uppercase tracking-luxe text-ivory transition hover:bg-ink-soft"
        >
          Add to Bag
        </button>
        <Link
          href="/appointments"
          className="w-full border border-ink/30 px-7 py-4 text-center text-xs uppercase tracking-luxe text-ink transition hover:border-ink"
        >
          Book an Appointment
        </Link>
      </div>
    );
  }

  // Enquiry / high-value pieces
  const isHighJewellery = product.category === 'high-jewellery';
  return (
    <div className="flex flex-col gap-3">
      <EnquiryModal
        triggerLabel={isHighJewellery ? 'Enquire' : 'Request a Quote'}
        title={isHighJewellery ? 'Private Enquiry' : 'Request a Quote'}
        subtitle={
          isHighJewellery
            ? 'This exceptional piece is presented by private appointment. Share your details and we will be in touch.'
            : 'Each piece is made to order around your chosen diamond. Tell us your wishes.'
        }
        source={isHighJewellery ? 'high-jewellery' : 'pdp'}
        productSlug={product.slug}
      />
      <Link
        href="/appointments"
        className="w-full border border-ink/30 px-7 py-4 text-center text-xs uppercase tracking-luxe text-ink transition hover:border-ink"
      >
        Book an Appointment
      </Link>
    </div>
  );
}
