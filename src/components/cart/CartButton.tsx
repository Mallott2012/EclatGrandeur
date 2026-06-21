'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/lib/store/cart';
import { cn } from '@/lib/utils';

export function CartButton({ light = false }: { light?: boolean }) {
  const setOpen = useCart((s) => s.setOpen);
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? items.reduce((n, i) => n + i.qty, 0) : 0;

  return (
    <button
      type="button"
      aria-label="Open shopping bag"
      onClick={() => setOpen(true)}
      className={cn('relative inline-flex items-center transition-colors', light ? 'text-ivory hover:text-champagne-soft' : 'text-ink hover:text-champagne-deep')}
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.25} />
      {count > 0 && (
        <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-champagne px-1 text-[9px] font-medium text-noir">
          {count}
        </span>
      )}
    </button>
  );
}
