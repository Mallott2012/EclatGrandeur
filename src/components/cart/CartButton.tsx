'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart, cartCount } from '@/lib/commerce/cart';

export function CartButton() {
  const { items, open } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = cartCount(items);

  return (
    <button
      type="button"
      aria-label="Open bag"
      onClick={open}
      className="relative text-ink/80 hover:text-ink"
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
      {mounted && count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-champagne text-[9px] text-ink">
          {count}
        </span>
      )}
    </button>
  );
}
