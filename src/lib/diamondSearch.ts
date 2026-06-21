import type {
  Diamond,
  DiamondShape,
  DiamondColour,
  DiamondClarity,
  DiamondCut,
} from '@/types';

// Quality scales, ordered BEST → worst. Index 0 is the highest grade.
export const COLOUR_SCALE: DiamondColour[] = ['D', 'E', 'F', 'G', 'H', 'I'];
export const CLARITY_SCALE: DiamondClarity[] = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1'];
export const CUT_SCALE: DiamondCut[] = ['Ideal', 'Excellent', 'Very Good'];

export type SortKey =
  | 'price-asc'
  | 'price-desc'
  | 'carat-asc'
  | 'carat-desc'
  | 'cut'
  | 'colour'
  | 'clarity';

export interface DiamondFilters {
  shapes: DiamondShape[]; // empty = all
  priceMin: number;
  priceMax: number;
  caratMin: number;
  caratMax: number;
  cutMin: number; // index into CUT_SCALE (0 best)
  cutMax: number;
  colourMin: number; // index into COLOUR_SCALE
  colourMax: number;
  clarityMin: number; // index into CLARITY_SCALE
  clarityMax: number;
}

/** Inclusive bounds for the whole inventory, used to seed the sliders. */
export function inventoryBounds(diamonds: Diamond[]) {
  const prices = diamonds.map((d) => d.price.amount);
  const carats = diamonds.map((d) => d.carat);
  return {
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    caratMin: Math.min(...carats),
    caratMax: Math.max(...carats),
  };
}

export function defaultFilters(diamonds: Diamond[]): DiamondFilters {
  const b = inventoryBounds(diamonds);
  return {
    shapes: [],
    priceMin: b.priceMin,
    priceMax: b.priceMax,
    caratMin: b.caratMin,
    caratMax: b.caratMax,
    cutMin: 0,
    cutMax: CUT_SCALE.length - 1,
    colourMin: 0,
    colourMax: COLOUR_SCALE.length - 1,
    clarityMin: 0,
    clarityMax: CLARITY_SCALE.length - 1,
  };
}

export function filterDiamonds(diamonds: Diamond[], f: DiamondFilters): Diamond[] {
  return diamonds.filter((d) => {
    if (f.shapes.length && !f.shapes.includes(d.shape)) return false;
    if (d.price.amount < f.priceMin || d.price.amount > f.priceMax) return false;
    if (d.carat < f.caratMin || d.carat > f.caratMax) return false;
    const cutI = CUT_SCALE.indexOf(d.cut);
    if (cutI < f.cutMin || cutI > f.cutMax) return false;
    const colI = COLOUR_SCALE.indexOf(d.colour);
    if (colI < f.colourMin || colI > f.colourMax) return false;
    const claI = CLARITY_SCALE.indexOf(d.clarity);
    if (claI < f.clarityMin || claI > f.clarityMax) return false;
    return true;
  });
}

export function sortDiamonds(diamonds: Diamond[], key: SortKey): Diamond[] {
  const list = [...diamonds];
  switch (key) {
    case 'price-asc':
      return list.sort((a, b) => a.price.amount - b.price.amount);
    case 'price-desc':
      return list.sort((a, b) => b.price.amount - a.price.amount);
    case 'carat-asc':
      return list.sort((a, b) => a.carat - b.carat);
    case 'carat-desc':
      return list.sort((a, b) => b.carat - a.carat);
    case 'cut':
      return list.sort((a, b) => CUT_SCALE.indexOf(a.cut) - CUT_SCALE.indexOf(b.cut));
    case 'colour':
      return list.sort((a, b) => COLOUR_SCALE.indexOf(a.colour) - COLOUR_SCALE.indexOf(b.colour));
    case 'clarity':
      return list.sort(
        (a, b) => CLARITY_SCALE.indexOf(a.clarity) - CLARITY_SCALE.indexOf(b.clarity)
      );
    default:
      return list;
  }
}
