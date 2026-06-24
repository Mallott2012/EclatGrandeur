// ─────────────────────────────────────────────────────────────────────────────
// Éclat Grandeur — domain model
// ─────────────────────────────────────────────────────────────────────────────

export type Currency = 'GBP' | 'USD' | 'EUR';

/** Money is stored in MINOR units (pence) to avoid floating-point drift. */
export interface Money {
  amount: number;
  currency: Currency;
}

export type Metal = 'platinum' | 'white-gold' | 'yellow-gold' | 'rose-gold';

export const METAL_LABELS: Record<Metal, string> = {
  platinum: 'Platinum',
  'white-gold': 'White Gold',
  'yellow-gold': 'Yellow Gold',
  'rose-gold': 'Rose Gold',
};

/** Hex pairs (light highlight + base) used by the SVG metal gradients. */
export const METAL_SWATCH: Record<Metal, { light: string; base: string; deep: string }> = {
  platinum: { light: '#fbfbfa', base: '#d9d8d4', deep: '#9b9a96' },
  'white-gold': { light: '#fdfcf8', base: '#e4ded2', deep: '#a8a193' },
  'yellow-gold': { light: '#f7e6a8', base: '#e3bf63', deep: '#9c7a2e' },
  'rose-gold': { light: '#f6d7c9', base: '#e0a78f', deep: '#a86a52' },
};

export type Category =
  | 'engagement-rings'
  | 'earrings'
  | 'necklaces'
  | 'bracelets'
  | 'wedding-bands'
  | 'high-jewellery';

export const CATEGORY_LABELS: Record<Category, string> = {
  'engagement-rings': 'Engagement Rings',
  earrings: 'Earrings',
  necklaces: 'Necklaces',
  bracelets: 'Bracelets',
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

/**
 * How a piece is rendered by the procedural SVG jewellery engine.
 * Every product carries an `art` block instead of photography.
 */
export type JewelKind =
  | 'solitaire-ring'
  | 'halo-ring'
  | 'three-stone-ring'
  | 'pave-ring'
  | 'eternity-band'
  | 'signet-band'
  | 'stud-earrings'
  | 'drop-earrings'
  | 'hoop-earrings'
  | 'pendant-necklace'
  | 'riviere-necklace'
  | 'tennis-bracelet'
  | 'bangle-bracelet'
  | 'chain-bracelet';

export interface JewelArt {
  kind: JewelKind;
  shape: DiamondShape;
  /** Default metal for cards / hero render. */
  metal: Metal;
  /** Relative visual scale of the centre stone, 0.6–1.6. */
  caratVisual?: number;
  /** Optional accent stone count for pavé / halo density. */
  accents?: number;
}

export interface Certification {
  authority: 'GIA' | 'IGI' | 'HRD';
  reportNumber?: string;
  ethical: {
    conflictFree: boolean;
    traceable: boolean;
    origin?: string;
  };
}

/** 'buyable' = online checkout; 'enquiry' = appointment / request-a-quote. */
export type PurchaseMode = 'buyable' | 'enquiry';

export interface PurchaseInfo {
  mode: PurchaseMode;
  price?: Money;
  priceDisplay: 'exact' | 'from' | 'on-request';
  financingEligible?: boolean;
  inStock?: boolean;
  leadTimeDays?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  collectionSlugs: string[];
  description: string;
  details: string;
  art: JewelArt;
  metals: Metal[];
  occasions?: string[];
  purchase: PurchaseInfo;
  specs: Record<string, string>;
  certification?: Certification;
  related?: string[];
  featured?: boolean;
  isNew?: boolean;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  art: JewelArt;
  productSlugs: string[];
  featured?: boolean;
}

// ── Diamond inventory (the build-your-own configurator) ──────────────────────

export type DiamondColour = 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
export type DiamondClarity = 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1';
export type DiamondCut = 'Ideal' | 'Excellent' | 'Very Good';

export interface Diamond {
  id: string;
  shape: DiamondShape;
  carat: number;
  colour: DiamondColour;
  clarity: DiamondClarity;
  cut: DiamondCut;
  price: Money;
  report: string;
  authority: 'GIA' | 'IGI';
  /** Extended grading detail surfaced on the diamond detail panel. */
  table?: number;
  depth?: number;
  polish?: 'Excellent' | 'Very Good' | 'Good';
  symmetry?: 'Excellent' | 'Very Good' | 'Good';
  fluorescence?: 'None' | 'Faint' | 'Medium' | 'Strong';
}

export interface Setting {
  id: string;
  slug: string;
  name: string;
  kind: JewelKind;
  description: string;
  basePrice: Money;
  metals: Metal[];
  /** Shapes this setting can accept. */
  shapes: DiamondShape[];
}
