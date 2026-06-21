import type {
  Certification,
  DiamondShape,
  Metal,
  Model3D,
  Money,
} from './common';

export type DiamondCut = 'Excellent' | 'Very Good' | 'Good' | 'Fair';
export type DiamondColor = 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';
export type DiamondClarity =
  | 'FL'
  | 'IF'
  | 'VVS1'
  | 'VVS2'
  | 'VS1'
  | 'VS2'
  | 'SI1'
  | 'SI2';
export type DiamondType = 'natural' | 'lab-grown';

export interface Diamond {
  id: string;
  sku: string;
  shape: DiamondShape;
  carat: number;
  cut: DiamondCut;
  color: DiamondColor;
  clarity: DiamondClarity;
  price: Money;
  certification: Certification;
  measurements?: string;
  fluorescence?: 'None' | 'Faint' | 'Medium' | 'Strong';
  available: boolean;
  model3d?: Model3D;
  origin?: string;
  type: DiamondType;
}

export interface RingSetting {
  id: string;
  slug: string;
  name: string;
  style:
    | 'solitaire'
    | 'halo'
    | 'pave'
    | 'three-stone'
    | 'vintage'
    | 'bezel'
    | 'hidden-halo';
  /** Price of the setting itself (in the base metal). */
  basePrice: Money;
  metals: Metal[];
  /** Price adjustment by metal, in minor units. */
  metalPriceDelta?: Partial<Record<Metal, number>>;
  compatibleShapes: DiamondShape[];
  caratRange: { min: number; max: number };
  images: { src: string; alt: string }[];
  model3d?: Model3D;
}

export interface BuiltRing {
  setting: RingSetting;
  diamond: Diamond;
  metal: Metal;
  ringSize?: string;
  totalPrice: Money;
}
