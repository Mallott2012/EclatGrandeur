import productsData from '@/data/products.json';
import type { Product } from '@/types/product';
import type { Category } from '@/types/common';

const products = productsData as unknown as Product[];

export function getProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: Category): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}

export function getProductsBySlugs(slugs: string[]): Product[] {
  return slugs
    .map((s) => getProductBySlug(s))
    .filter((p): p is Product => Boolean(p));
}

export function getAllProductSlugs(): { category: Category; slug: string }[] {
  return products.map((p) => ({ category: p.category, slug: p.slug }));
}
