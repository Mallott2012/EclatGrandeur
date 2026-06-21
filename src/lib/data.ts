import productsData from '@/data/products.json';
import collectionsData from '@/data/collections.json';
import diamondsData from '@/data/diamonds.json';
import settingsData from '@/data/settings.json';
import type { Product, Collection, Diamond, Setting, Category } from '@/types';

const products = productsData as unknown as Product[];
const collections = collectionsData as unknown as Collection[];
const diamonds = diamondsData as unknown as Diamond[];
const settings = settingsData as unknown as Setting[];

// ── products ─────────────────────────────────────────────────────────────────
export const getProducts = () => products;
export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getProductsByCategory = (c: Category) => products.filter((p) => p.category === c);
export const getFeaturedProducts = () => products.filter((p) => p.featured);
export const getNewProducts = () => products.filter((p) => p.isNew);
export const getProductsBySlugs = (slugs: string[]) =>
  slugs.map((s) => getProductBySlug(s)).filter((p): p is Product => Boolean(p));
export const getAllProductSlugs = () => products.map((p) => p.slug);

// ── collections ──────────────────────────────────────────────────────────────
export const getCollections = () => collections;
export const getCollectionBySlug = (slug: string) => collections.find((c) => c.slug === slug);
export const getFeaturedCollections = () => collections.filter((c) => c.featured);

// ── builder inventory ────────────────────────────────────────────────────────
export const getDiamonds = () => diamonds;
export const getDiamondById = (id: string) => diamonds.find((d) => d.id === id);
export const getSettings = () => settings;
export const getSettingBySlug = (slug: string) => settings.find((s) => s.slug === slug);
export const getSettingById = (id: string) => settings.find((s) => s.id === id);
