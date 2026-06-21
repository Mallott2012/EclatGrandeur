import type { ImageAsset } from './common';

export interface Collection {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  heroImage: ImageAsset;
  productSlugs: string[];
  featured?: boolean;
}
