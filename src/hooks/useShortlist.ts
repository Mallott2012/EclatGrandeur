'use client';

import { useState, useEffect, useCallback } from 'react';

export interface ShortlistItem {
  id: string;           // e.g. 'ring-eclat-solitaire' or 'earring-brilliance-studs'
  category: string;     // 'Engagement Rings' | 'Earrings' | etc.
  name: string;
  subtitle: string;
  image: string;
  href: string;
  metal: string;
  basePrice: number;
  // optional configuration snapshot
  diamondCarat?: number;
  diamondColor?: string;
  diamondClarity?: string;
  diamondPrice?: number;
  totalPrice: number;
  savedAt: number;      // Date.now()
}

const KEY = 'eclat_shortlist';

function read(): ShortlistItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
  catch { return []; }
}

function write(items: ShortlistItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function useShortlist() {
  const [items, setItems] = useState<ShortlistItem[]>([]);

  // Hydrate on mount
  useEffect(() => { setItems(read()); }, []);

  const add = useCallback((item: ShortlistItem) => {
    setItems(prev => {
      const next = [{ ...item, savedAt: Date.now() }, ...prev.filter(x => x.id !== item.id)];
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(x => x.id !== id);
      write(next);
      return next;
    });
  }, []);

  const toggle = useCallback((item: ShortlistItem) => {
    setItems(prev => {
      const exists = prev.some(x => x.id === item.id);
      const next = exists
        ? prev.filter(x => x.id !== item.id)
        : [{ ...item, savedAt: Date.now() }, ...prev];
      write(next);
      return next;
    });
  }, []);

  const has = useCallback((id: string) => items.some(x => x.id === id), [items]);

  return { items, add, remove, toggle, has, count: items.length };
}
