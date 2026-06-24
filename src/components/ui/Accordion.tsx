'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: { title: string; content: React.ReactNode }[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState<number | null>(defaultOpen);
  return (
    <div className="flex flex-col border-t border-ink/10">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.title} className="border-b border-ink/10">
            <button
              className="flex w-full items-center justify-between py-4 text-left"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="text-[12px] uppercase tracking-luxe text-ink">{item.title}</span>
              {isOpen ? <Minus className="h-4 w-4 text-ink/60" /> : <Plus className="h-4 w-4 text-ink/60" />}
            </button>
            <div className={cn('grid transition-all duration-300 ease-luxe', isOpen ? 'grid-rows-[1fr] pb-5' : 'grid-rows-[0fr]')}>
              <div className="overflow-hidden text-sm font-light leading-relaxed text-ink/70">{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
