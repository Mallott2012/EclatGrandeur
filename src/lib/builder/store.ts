'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Metal } from '@/types/common';

interface BuilderState {
  settingSlug?: string;
  diamondSku?: string;
  metal: Metal;
  ringSize?: string;
  setSetting: (slug: string) => void;
  setDiamond: (sku: string) => void;
  setMetal: (metal: Metal) => void;
  setRingSize: (size: string) => void;
  reset: () => void;
}

export const useBuilder = create<BuilderState>()(
  persist(
    (set) => ({
      metal: 'platinum',
      setSetting: (settingSlug) => set({ settingSlug }),
      setDiamond: (diamondSku) => set({ diamondSku }),
      setMetal: (metal) => set({ metal }),
      setRingSize: (ringSize) => set({ ringSize }),
      reset: () =>
        set({
          settingSlug: undefined,
          diamondSku: undefined,
          ringSize: undefined,
          metal: 'platinum',
        }),
    }),
    {
      name: 'eg-builder',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
