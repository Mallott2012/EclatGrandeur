'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Metal } from '@/types';

interface BuilderState {
  settingId: string | null;
  diamondId: string | null;
  metal: Metal;
  setSetting: (id: string) => void;
  setDiamond: (id: string) => void;
  setMetal: (metal: Metal) => void;
  reset: () => void;
}

export const useBuilder = create<BuilderState>()(
  persist(
    (set) => ({
      settingId: null,
      diamondId: null,
      metal: 'platinum',
      setSetting: (settingId) => set({ settingId }),
      setDiamond: (diamondId) => set({ diamondId }),
      setMetal: (metal) => set({ metal }),
      reset: () => set({ settingId: null, diamondId: null, metal: 'platinum' }),
    }),
    { name: 'eg-builder' }
  )
);
