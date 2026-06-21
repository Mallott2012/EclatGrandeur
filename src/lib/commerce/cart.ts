'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Money } from '@/types/common';

export interface CartItem {
  id: string; // product slug (+ variant if any)
  slug: string;
  name: string;
  category: string;
  image: string;
  price: Money;
  quantity: number;
  meta?: string; // e.g. metal / size
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              isOpen: true,
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { isOpen: true, items: [...state.items, { ...item, quantity }] };
        }),
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    { name: 'eg-cart' }
  )
);

export function cartTotal(items: CartItem[]): Money {
  const currency = items[0]?.price.currency ?? 'GBP';
  const amount = items.reduce((sum, i) => sum + i.price.amount * i.quantity, 0);
  return { amount, currency };
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
