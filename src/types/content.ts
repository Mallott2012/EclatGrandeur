import type { ImageAsset } from './common';

export type ArticleCategory =
  | 'diamond-education'
  | '4cs'
  | 'certification'
  | 'ethical-sourcing'
  | 'care'
  | 'buying-guide';

export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  heroImage: ImageAsset;
  readingTime?: number;
  order?: number;
  publishedAt: string;
  related?: string[];
}

/** Body is rendered as structured blocks in v1 (MDX swap-in later). */
export interface ArticleBlock {
  type: 'heading' | 'paragraph' | 'list' | 'quote';
  text?: string;
  items?: string[];
}

export interface Article extends ArticleMeta {
  body: ArticleBlock[];
}
