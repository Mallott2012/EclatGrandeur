'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JewelArt, Money } from '@/types';

export interface CartItem {
  id: string;
  name: string;
  href: string;
  price: Money;
  qty: number;
  meta?: string;
  art: JewelArt;
}

interface CartState {
  items: CartItem[];
  open: boolean;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
  count: () => number;
  subtotal: () => Money;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              open: true,
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return { open: true, items: [...state.items, { ...item, qty }] };
        }),
      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQty: (id, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, qty: Math.max(0, qty) } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => {
        const items = get().items;
        const currency = items[0]?.price.currency ?? 'GBP';
        return {
          amount: items.reduce((sum, i) => sum + i.price.amount * i.qty, 0),
          currency,
        };
      },
    }),
    { name: 'eg-cart' }
  )
);
