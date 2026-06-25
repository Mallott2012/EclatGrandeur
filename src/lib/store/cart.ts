'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JewelArt, Money, ConfiguredEngagementRing } from '@/types';

export interface CartItem {
  id:          string;
  name:        string;
  href:        string;
  price:       Money;
  qty:         number;
  meta?:       string;
  art:         JewelArt;
  ringConfig?: ConfiguredEngagementRing;
}

function generateCartToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

interface CartState {
  cartToken: string;
  items:     CartItem[];
  open:      boolean;
  add:       (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  remove:    (id: string) => void;
  setQty:    (id: string, qty: number) => void;
  clear:     () => void;
  setOpen:   (open: boolean) => void;
  count:     () => number;
  subtotal:  () => Money;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      cartToken: generateCartToken(),
      items:     [],
      open:      false,
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            // Configured rings are always qty=1 — just open the drawer
            if (item.ringConfig) return { open: true };
            return {
              open:  true,
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          // Prevent duplicate diamond reservation
          if (item.ringConfig) {
            const hasDiamond = state.items.some(
              (i) => i.ringConfig?.diamondId === item.ringConfig!.diamondId
            );
            if (hasDiamond) return { open: true };
          }
          return {
            open:  true,
            items: [...state.items, { ...item, qty: item.ringConfig ? 1 : qty }],
          };
        }),
      remove:  (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      setQty:  (id, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => {
              if (i.id !== id) return i;
              // Configured rings are always qty=1
              if (i.ringConfig) return i;
              return { ...i, qty: Math.max(0, qty) };
            })
            .filter((i) => i.qty > 0),
        })),
      clear: () => {
        const { items, cartToken } = get()
        // Fire-and-forget hold releases for any configured rings before clearing
        items.filter(i => i.ringConfig).forEach(i => {
          fetch('/api/rings/release', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ diamondId: i.ringConfig!.diamondId, cartToken }),
          }).catch(() => {})
        })
        set({ items: [] })
      },
      setOpen: (open) => set({ open }),
      count:   () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => {
        const items    = get().items;
        const currency = items[0]?.price.currency ?? 'GBP';
        return {
          amount:   items.reduce((sum, i) => sum + i.price.amount * i.qty, 0),
          currency,
        };
      },
    }),
    { name: 'eg-cart' }
  )
);
