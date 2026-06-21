import type {
  Category,
  Certification,
  ImageAsset,
  Metal,
  Model3D,
  Money,
} from './common';

/** 'buyable' = online checkout; 'enquiry' = request-a-quote / appointment only. */
export type PurchaseMode = 'buyable' | 'enquiry';

export interface PurchaseInfo {
  mode: PurchaseMode;
  /** Required when buyable; for enquiry pieces an optional "from" price. */
  price?: Money;
  priceDisplay?: 'exact' | 'from' | 'on-request';
  /** Show Klarna/Affirm instalment messaging. */
  financingEligible?: boolean;
  /** Buyable only. */
  inStock?: boolean;
  /** Bespoke / enquiry lead time. */
  leadTimeDays?: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  metal?: Metal;
  caratTotal?: number;
  /** Ring size, chain length, etc. */
  size?: string;
  purchase: PurchaseInfo;
  images?: ImageAsset[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: Category;
  collectionSlugs: string[];
  /** Short marketing line. */
  description: string;
  /** Long craftsmanship copy. */
  details: string;
  images: ImageAsset[];
  model3d?: Model3D;
  metals: Metal[];
  occasions?: string[];
  /** Base pricing/availability; variants may override. */
  purchase: PurchaseInfo;
  variants?: ProductVariant[];
  specs: Record<string, string>;
  certification?: Certification;
  related?: string[];
  seo?: { title?: string; description?: string };
  featured?: boolean;
}
