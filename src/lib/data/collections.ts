import collectionsData from '@/data/collections.json';
import type { Collection } from '@/types/collection';

const collections = collectionsData as unknown as Collection[];

export function getCollections(): Collection[] {
  return collections;
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getFeaturedCollections(): Collection[] {
  return collections.filter((c) => c.featured);
}
