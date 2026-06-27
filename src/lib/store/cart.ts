'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { JewelArt, Money, ConfiguredEngagementRing, ConfiguredEarring } from '@/types';
import { getPairIdsFromEarringConfig, wouldDuplicatePairInCart } from '@/lib/earrings/cart-helpers';

export interface CartItem {
  id:             string;
  name:           string;
  href:           string;
  price:          Money;
  qty:            number;
  meta?:          string;
  art:            JewelArt;
  ringConfig?:    ConfiguredEngagementRing;
  earringConfig?: ConfiguredEarring;
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
          // ── Configured engagement ring dedup ───────────────────────────────
          if (item.ringConfig) {
            const existing = state.items.find(i => i.id === item.id);
            if (existing) return { open: true };
            const hasDiamond = state.items.some(
              i => i.ringConfig?.diamondId === item.ringConfig!.diamondId,
            );
            if (hasDiamond) return { open: true };
            return { open: true, items: [...state.items, { ...item, qty: 1 }] };
          }

          // ── Configured earring dedup ───────────────────────────────────────
          if (item.earringConfig) {
            const newPairIds = getPairIdsFromEarringConfig(item.earringConfig);
            // Prevent same pair from being in two cart lines
            if (wouldDuplicatePairInCart(state.items, newPairIds)) {
              return { open: true };
            }
            return { open: true, items: [...state.items, { ...item, qty: 1 }] };
          }

          // ── Standard item ──────────────────────────────────────────────────
          const existing = state.items.find(i => i.id === item.id);
          if (existing) {
            return {
              open:  true,
              items: state.items.map(i =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { open: true, items: [...state.items, { ...item, qty }] };
        }),

      remove: (id) => {
        const state = get();
        const item  = state.items.find(i => i.id === id);
        // Release ring diamond
        if (item?.ringConfig) {
          fetch('/api/rings/release', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ diamondId: item.ringConfig.diamondId, cartToken: state.cartToken }),
          }).catch(() => {});
        }
        // Release all earring pairs
        if (item?.earringConfig) {
          const pairIds = getPairIdsFromEarringConfig(item.earringConfig);
          if (pairIds.length > 0) {
            fetch('/api/earrings/release', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ pairIds, cartToken: state.cartToken }),
            }).catch(() => {});
          }
        }
        set(s => ({ items: s.items.filter(i => i.id !== id) }));
      },

      setQty: (id, qty) =>
        set((state) => ({
          items: state.items
            .map(i => {
              if (i.id !== id) return i;
              // Configured items are always qty=1
              if (i.ringConfig || i.earringConfig) return i;
              return { ...i, qty: Math.max(0, qty) };
            })
            .filter(i => i.qty > 0),
        })),

      clear: () => {
        const { items, cartToken } = get();
        // Release ring diamonds
        items.filter(i => i.ringConfig).forEach(i => {
          fetch('/api/rings/release', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ diamondId: i.ringConfig!.diamondId, cartToken }),
          }).catch(() => {});
        });
        // Release all earring pairs
        const earringItems = items.filter(i => i.earringConfig);
        if (earringItems.length > 0) {
          const pairIds = earringItems.flatMap(i => getPairIdsFromEarringConfig(i.earringConfig!));
          if (pairIds.length > 0) {
            fetch('/api/earrings/release', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ pairIds, cartToken }),
            }).catch(() => {});
          }
        }
        set({ items: [] });
      },

      setOpen:  (open) => set({ open }),
      count:    () => get().items.reduce((n, i) => n + i.qty, 0),
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
