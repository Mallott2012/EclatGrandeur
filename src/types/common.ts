export type Currency = 'GBP' | 'USD' | 'EUR';

/** Money is stored in MINOR units (e.g. pence) to avoid float drift. */
export interface Money {
  amount: number;
  currency: Currency;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isPrimary?: boolean;
}

/** Optional real-time 3D model for the JewelViewer. */
export interface Model3D {
  /** Path to a .glb under /public/models, or empty to use placeholder. */
  src: string;
  /** Named metal materials the configurator can recolour. */
  metalMaterials?: string[];
  /** Named node that holds the centre stone (configurator binds shape here). */
  stoneNode?: string;
}

export type Metal = 'platinum' | 'yellow-gold' | 'white-gold' | 'rose-gold';

export const METAL_LABELS: Record<Metal, string> = {
  platinum: 'Platinum',
  'yellow-gold': 'Yellow Gold',
  'white-gold': 'White Gold',
  'rose-gold': 'Rose Gold',
};

export type Category =
  | 'engagement-rings'
  | 'necklaces'
  | 'bracelets'
  | 'earrings'
  | 'wedding-bands'
  | 'high-jewellery';

export const CATEGORY_LABELS: Record<Category, string> = {
  'engagement-rings': 'Engagement Rings',
  necklaces: 'Necklaces',
  bracelets: 'Bracelets',
  earrings: 'Earrings',
  'wedding-bands': 'Wedding Bands',
  'high-jewellery': 'High Jewellery',
};

export type DiamondShape =
  | 'round'
  | 'oval'
  | 'princess'
  | 'emerald'
  | 'cushion'
  | 'pear'
  | 'marquise'
  | 'radiant'
  | 'asscher'
  | 'heart';

export const DIAMOND_SHAPE_LABELS: Record<DiamondShape, string> = {
  round: 'Round Brilliant',
  oval: 'Oval',
  princess: 'Princess',
  emerald: 'Emerald',
  cushion: 'Cushion',
  pear: 'Pear',
  marquise: 'Marquise',
  radiant: 'Radiant',
  asscher: 'Asscher',
  heart: 'Heart',
};

export interface Certification {
  authority: 'GIA' | 'IGI' | 'HRD';
  reportNumber?: string;
  reportUrl?: string;
  ethical?: {
    conflictFree: boolean;
    traceable: boolean;
    origin?: string;
  };
}
